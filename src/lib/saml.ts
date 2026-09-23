import * as asn1js from 'asn1js';
import type { CertificateInfo, DecodedSaml, SamlAttribute } from './types';
import { base64ToBytes, bytesToHex, normalizeInput, samlInputToXml } from './encoding';
import { sha256 } from './sha256';

const DSIG_NS = 'http://www.w3.org/2000/09/xmldsig#';

/** Direct child elements matching a local name (namespace prefix ignored). */
function children(el: Element | null | undefined, localName: string): Element[] {
  if (!el) return [];
  return Array.from(el.children).filter((c) => c.localName === localName);
}

function child(el: Element | null | undefined, ...path: string[]): Element | null {
  let cur: Element | null | undefined = el;
  for (const name of path) {
    cur = children(cur, name)[0];
    if (!cur) return null;
  }
  return cur ?? null;
}

function text(el: Element | null | undefined): string {
  return el?.textContent?.trim() ?? '';
}

function attr(el: Element | null | undefined, name: string): string {
  return el?.getAttribute(name)?.trim() ?? '';
}

const OID_NAMES: Record<string, string> = {
  '2.5.4.3': 'CN',
  '2.5.4.6': 'C',
  '2.5.4.7': 'L',
  '2.5.4.8': 'ST',
  '2.5.4.10': 'O',
  '2.5.4.11': 'OU',
  '1.2.840.113549.1.9.1': 'E',
};

/** Formats an X.501 Name (SEQUENCE OF SET OF {type OID, value}) as "CN=…, O=…". */
function formatDn(name: asn1js.AsnType | undefined): string {
  const parts: string[] = [];
  const rdns = name instanceof asn1js.Sequence ? name.valueBlock.value : [];
  for (const set of rdns) {
    if (!(set instanceof asn1js.Set)) continue;
    for (const atv of set.valueBlock.value) {
      if (!(atv instanceof asn1js.Sequence)) continue;
      const [oid, val] = atv.valueBlock.value;
      if (!(oid instanceof asn1js.ObjectIdentifier)) continue;
      const type = oid.valueBlock.toString();
      const raw = (val as { valueBlock?: { value?: unknown } } | undefined)?.valueBlock?.value;
      parts.push(`${OID_NAMES[type] ?? type}=${typeof raw === 'string' ? raw : '?'}`);
    }
  }
  return parts.length ? parts.join(', ') : 'Unknown';
}

function asnTime(t: asn1js.AsnType | undefined): Date | null {
  if (t instanceof asn1js.UTCTime || t instanceof asn1js.GeneralizedTime) return t.toDate();
  return null;
}

function toPem(b64: string): string {
  const body = b64.replace(/\s+/g, '').match(/.{1,64}/g)?.join('\n') ?? '';
  return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
}

function parseCertificate(certBase64: string): CertificateInfo {
  const pem = toPem(certBase64);
  try {
    const der = base64ToBytes(certBase64);
    const asn1 = asn1js.fromBER(der);
    if (asn1.offset === -1 || !(asn1.result instanceof asn1js.Sequence)) throw new Error('ASN.1 parse error');

    // Certificate ::= SEQUENCE { tbsCertificate, signatureAlgorithm, signature }
    const tbs = asn1.result.valueBlock.value[0];
    if (!(tbs instanceof asn1js.Sequence)) throw new Error('Missing TBSCertificate');
    const f = tbs.valueBlock.value;
    // Optional [0] EXPLICIT version shifts the remaining fields by one
    const o = f[0]?.idBlock.tagClass === 3 ? 1 : 0;
    const serial = f[o];
    const validity = f[o + 3];
    const [nb, na] = validity instanceof asn1js.Sequence ? validity.valueBlock.value : [];
    if (!(serial instanceof asn1js.Integer)) throw new Error('Missing serial');

    return {
      parsed: true,
      subject: formatDn(f[o + 4]),
      issuer: formatDn(f[o + 2]),
      notBefore: asnTime(nb),
      notAfter: asnTime(na),
      serialNumber: bytesToHex(new Uint8Array(serial.valueBlock.valueHexView), ':'),
      sha256Fingerprint: bytesToHex(sha256(der), ':'),
      pem,
    };
  } catch {
    return {
      parsed: false,
      subject: 'Unable to parse certificate',
      issuer: '',
      notBefore: null,
      notAfter: null,
      serialNumber: '',
      sha256Fingerprint: '',
      pem,
    };
  }
}

/** Indents XML for display. */
function prettyPrintXml(doc: Document): string {
  const lines: string[] = [];
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;');

  const walk = (node: Element, depth: number) => {
    const pad = '  '.repeat(depth);
    const attrs = Array.from(node.attributes)
      .map((a) => ` ${a.name}="${escAttr(a.value)}"`)
      .join('');
    const elementKids = Array.from(node.children);
    const ownText = Array.from(node.childNodes)
      .filter((n) => n.nodeType === Node.TEXT_NODE || n.nodeType === Node.CDATA_SECTION_NODE)
      .map((n) => n.textContent ?? '')
      .join('')
      .trim();

    if (elementKids.length === 0) {
      lines.push(ownText ? `${pad}<${node.tagName}${attrs}>${esc(ownText)}</${node.tagName}>` : `${pad}<${node.tagName}${attrs}/>`);
      return;
    }
    lines.push(`${pad}<${node.tagName}${attrs}>`);
    if (ownText) lines.push(`${pad}  ${esc(ownText)}`);
    elementKids.forEach((k) => walk(k, depth + 1));
    lines.push(`${pad}</${node.tagName}>`);
  };

  walk(doc.documentElement, 0);
  return lines.join('\n');
}

function signatureInfo(el: Element | null) {
  const sig = el ? children(el, 'Signature').find((s) => s.namespaceURI === DSIG_NS) ?? null : null;
  return {
    present: !!sig,
    signatureAlgorithm: attr(child(sig, 'SignedInfo', 'SignatureMethod'), 'Algorithm'),
    digestAlgorithm: attr(child(sig, 'SignedInfo', 'Reference', 'DigestMethod'), 'Algorithm'),
    certs: sig
      ? Array.from(sig.getElementsByTagNameNS(DSIG_NS, 'X509Certificate')).map((c) => text(c))
      : [],
  };
}

export function decodeSaml(input: string): DecodedSaml {
  const xmlString = samlInputToXml(normalizeInput(input));
  if (!xmlString) {
    throw new Error('Invalid SAML input: could not base64-decode or inflate it into XML.');
  }

  const doc = new DOMParser().parseFromString(xmlString, 'application/xml');
  const parserError = doc.getElementsByTagName('parsererror')[0];
  if (parserError) {
    const detail = (parserError.textContent ?? '')
      .replace(/^This page contains the following errors:/i, '')
      .replace(/Below is a rendering of the page.*$/is, '')
      .trim()
      .split('\n')[0];
    throw new Error(`Malformed XML: ${detail || 'parser error'}`);
  }

  const root = doc.documentElement;
  const rootName = root.localName;
  if (rootName !== 'Response' && rootName !== 'Assertion') {
    throw new Error(
      `This is a SAML <${rootName}>, not a Response. SSO Doctor analyzes SAML Responses and Assertions from the IdP.`,
    );
  }

  const response = rootName === 'Response' ? root : null;
  const assertions = rootName === 'Assertion' ? [root] : children(response, 'Assertion');
  const assertion = assertions[0] ?? null;
  const encryptedAssertion = children(response, 'EncryptedAssertion').length > 0;

  const statusCodeEl = child(response, 'Status', 'StatusCode');
  const subjectConf = child(assertion, 'Subject', 'SubjectConfirmation');
  const subjectConfData = child(subjectConf, 'SubjectConfirmationData');
  const conditions = child(assertion, 'Conditions');
  const authn = child(assertion, 'AuthnStatement');

  const audiences = children(conditions, 'AudienceRestriction')
    .flatMap((ar) => children(ar, 'Audience'))
    .map(text)
    .filter(Boolean);

  const attributes: SamlAttribute[] = children(assertion, 'AttributeStatement')
    .flatMap((st) => children(st, 'Attribute'))
    .map((a) => ({
      name: attr(a, 'Name'),
      friendlyName: attr(a, 'FriendlyName'),
      values: children(a, 'AttributeValue').map(text),
    }));

  const responseSig = signatureInfo(response);
  const assertionSig = signatureInfo(assertion);
  const certStrings = Array.from(new Set([...assertionSig.certs, ...responseSig.certs])).filter(Boolean);

  const nameIdEl = child(assertion, 'Subject', 'NameID');

  return {
    rootElement: rootName,
    responseId: attr(root, 'ID'),
    issueInstant: attr(root, 'IssueInstant'),
    issuer: text(child(assertion, 'Issuer')) || text(child(response, 'Issuer')),
    destination: attr(response, 'Destination'),
    inResponseTo: attr(response, 'InResponseTo') || attr(subjectConfData, 'InResponseTo'),
    statusCode: attr(statusCodeEl, 'Value'),
    subStatusCode: attr(child(statusCodeEl, 'StatusCode'), 'Value'),
    statusMessage: text(child(response, 'Status', 'StatusMessage')),
    assertionCount: assertions.length,
    encryptedAssertion,
    responseSigned: responseSig.present,
    assertionSigned: assertionSig.present,
    signatureAlgorithm: assertionSig.signatureAlgorithm || responseSig.signatureAlgorithm,
    digestAlgorithm: assertionSig.digestAlgorithm || responseSig.digestAlgorithm,
    nameId: text(nameIdEl),
    nameIdFormat: attr(nameIdEl, 'Format'),
    subjectConfirmationMethod: attr(subjectConf, 'Method'),
    subjectConfirmationNotOnOrAfter: attr(subjectConfData, 'NotOnOrAfter'),
    recipient: attr(subjectConfData, 'Recipient'),
    notBefore: attr(conditions, 'NotBefore'),
    notOnOrAfter: attr(conditions, 'NotOnOrAfter'),
    audiences,
    authnInstant: attr(authn, 'AuthnInstant'),
    sessionIndex: attr(authn, 'SessionIndex'),
    sessionNotOnOrAfter: attr(authn, 'SessionNotOnOrAfter'),
    authnContextClassRef: text(child(authn, 'AuthnContext', 'AuthnContextClassRef')),
    attributes,
    certificates: certStrings.map(parseCertificate),
    rawXml: xmlString,
    prettyXml: prettyPrintXml(doc),
  };
}

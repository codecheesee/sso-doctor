import type { CheckResult, DecodedSaml, ValidationConfig } from '../types';
import { describeDate, parseDate } from '../time';

const SUCCESS = 'urn:oasis:names:tc:SAML:2.0:status:Success';
const BEARER = 'urn:oasis:names:tc:SAML:2.0:cm:bearer';

const STATUS_HINTS: Record<string, string> = {
  AuthnFailed: 'The IdP could not authenticate the user. Check the user\'s credentials, MFA state and account lock status in the IdP.',
  RequestDenied: 'The IdP refused the request. The user is often not assigned to this application in the IdP.',
  InvalidNameIDPolicy: 'The NameID format requested by the SP is not supported by the IdP. Align the NameIDPolicy in the AuthnRequest with the IdP config.',
  NoPassive: 'The SP asked for passive authentication (IsPassive=true) but the user has no IdP session.',
  NoAuthnContext: 'The requested AuthnContext (e.g. MFA level) could not be satisfied. Relax RequestedAuthnContext or enable that method in the IdP.',
  RequestUnsupported: 'The IdP does not support something in the AuthnRequest. Check the binding, signing and NameIDPolicy.',
  UnknownPrincipal: 'The IdP does not know this user.',
  Requester: 'The IdP blamed the SP request. Check the AuthnRequest issuer, ACS URL and signature.',
  Responder: 'The IdP hit an error on its side. Check the IdP logs.',
};

const norm = (s: string) => s.trim().replace(/\/+$/, '').toLowerCase();
const nearHint = (a: string, b: string) => (a !== b && norm(a) === norm(b) ? ' They differ only in case or a trailing slash.' : '');

function tail(uri: string): string {
  return uri.split(/[:#]/).pop() ?? uri;
}

function checkStatus(d: DecodedSaml): CheckResult {
  const id = 'saml-status';
  if (d.rootElement === 'Assertion') {
    return { id, status: 'INFO', title: 'Standalone Assertion', cause: 'The input is a bare Assertion, so there is no Response status.', fix: 'Paste the full SAMLResponse to check the status code.' };
  }
  if (!d.statusCode) {
    return { id, status: 'FAIL', title: 'Missing Status Code', cause: 'The Response has no <StatusCode>.', fix: 'The IdP response is malformed. Check the IdP logs.' };
  }
  if (d.statusCode !== SUCCESS) {
    const sub = d.subStatusCode ? tail(d.subStatusCode) : '';
    const hint = STATUS_HINTS[sub] ?? STATUS_HINTS[tail(d.statusCode)] ?? 'Check the IdP logs for details.';
    return {
      id,
      status: 'FAIL',
      title: `IdP Returned ${tail(d.statusCode)}${sub ? ` / ${sub}` : ''}`,
      cause: `The IdP did not authenticate the user.${d.statusMessage ? ` Message: "${d.statusMessage}".` : ''}`,
      fix: hint,
    };
  }
  return { id, status: 'PASS', title: 'Status: Success', cause: 'The IdP reports a successful authentication.', fix: '' };
}

function checkAssertionPresent(d: DecodedSaml): CheckResult {
  const id = 'saml-assertion';
  if (d.encryptedAssertion) {
    return {
      id,
      status: 'INFO',
      title: 'Assertion Is Encrypted',
      cause: 'The Response contains an <EncryptedAssertion>. Its contents (subject, conditions, attributes) cannot be read without the SP private key.',
      fix: 'To inspect it, temporarily disable assertion encryption in the IdP, or check the decrypted assertion in your SAML library debug logs.',
    };
  }
  if (d.assertionCount === 0) {
    return { id, status: d.statusCode === SUCCESS ? 'FAIL' : 'INFO', title: 'No Assertion', cause: 'The Response contains no Assertion.', fix: 'A successful Response must contain an Assertion. Check the IdP logs.' };
  }
  if (d.assertionCount > 1) {
    return { id, status: 'WARN', title: 'Multiple Assertions', cause: `The Response has ${d.assertionCount} assertions. Only the first one is analyzed.`, fix: 'Many SPs reject multiple assertions. Configure the IdP to send one.' };
  }
  return { id, status: 'PASS', title: 'Assertion Present', cause: 'The Response contains one Assertion.', fix: '' };
}

function checkSignature(d: DecodedSaml): CheckResult {
  const id = 'saml-signature';
  if (!d.responseSigned && !d.assertionSigned) {
    if (d.encryptedAssertion) {
      return { id, status: 'INFO', title: 'Signature Not Visible', cause: 'The Response is unsigned. The encrypted Assertion may carry its own signature.', fix: 'Verify your SP requires a signed Assertion.' };
    }
    if (d.assertionCount === 0) {
      return { id, status: 'INFO', title: 'Unsigned Response', cause: 'The Response is not signed. This is common for error responses without an Assertion.', fix: '' };
    }
    return { id, status: 'FAIL', title: 'Unsigned Response', cause: 'Neither the Response nor the Assertion has an XML signature.', fix: 'Enable signing in the IdP (sign the Assertion, or both). SPs must reject unsigned assertions.' };
  }
  const where = [d.responseSigned && 'Response', d.assertionSigned && 'Assertion'].filter(Boolean).join(' and ');
  return { id, status: 'PASS', title: 'Signature Present', cause: `${where} ${d.responseSigned && d.assertionSigned ? 'are' : 'is'} signed. This tool checks presence only, not cryptographic validity.`, fix: '' };
}

function checkSignatureAlgorithm(d: DecodedSaml): CheckResult | null {
  if (!d.signatureAlgorithm && !d.digestAlgorithm) return null;
  const id = 'saml-sigalg';
  const weak = /sha1$/i;
  const sig = tail(d.signatureAlgorithm) || 'unknown';
  const dig = tail(d.digestAlgorithm) || 'unknown';
  if (weak.test(d.signatureAlgorithm) || weak.test(d.digestAlgorithm)) {
    return { id, status: 'WARN', title: 'Weak SHA-1 Signature', cause: `Signature: ${sig}, digest: ${dig}. Many SPs reject SHA-1.`, fix: 'Switch the IdP signing algorithm to RSA-SHA256 and digest to SHA-256.' };
  }
  return { id, status: 'PASS', title: 'Signature Algorithm OK', cause: `Signature: ${sig}, digest: ${dig}.`, fix: '' };
}

function checkTimeValidity(d: DecodedSaml, config: ValidationConfig, now: Date): CheckResult {
  const id = 'saml-time';
  const nb = parseDate(d.notBefore);
  const noa = parseDate(d.notOnOrAfter);
  if (!d.notBefore && !d.notOnOrAfter) {
    return { id, status: 'WARN', title: 'Time Window Missing', cause: 'The Assertion has no NotBefore / NotOnOrAfter conditions.', fix: 'Configure the IdP to send assertion validity conditions.' };
  }
  if ((d.notBefore && !nb) || (d.notOnOrAfter && !noa)) {
    return { id, status: 'FAIL', title: 'Invalid Timestamp', cause: `Could not parse NotBefore "${d.notBefore}" or NotOnOrAfter "${d.notOnOrAfter}".`, fix: 'Timestamps must be ISO 8601 in UTC (e.g. 2024-01-15T10:05:00Z).' };
  }
  const skewMs = config.clockSkewSeconds * 1000;
  if (nb && now.getTime() < nb.getTime() - skewMs) {
    return { id, status: 'FAIL', title: 'Assertion Not Yet Valid', cause: `NotBefore is ${describeDate(nb, now)}.`, fix: `The IdP clock is ahead of this machine. Sync clocks with NTP or raise the clock skew (now ${config.clockSkewSeconds}s).` };
  }
  if (noa && now.getTime() >= noa.getTime() + skewMs) {
    return { id, status: 'FAIL', title: 'Assertion Expired', cause: `NotOnOrAfter was ${describeDate(noa, now)}.`, fix: 'Assertions are short-lived. Capture a fresh SAMLResponse. If it fails straight after login, check clock sync between IdP and SP.' };
  }
  return { id, status: 'PASS', title: 'Time Window Valid', cause: noa ? `The Assertion is valid until ${describeDate(noa, now)}.` : 'The Assertion is within its validity window.', fix: '' };
}

function checkSubjectConfirmation(d: DecodedSaml, config: ValidationConfig, now: Date): CheckResult | null {
  if (!d.subjectConfirmationMethod && !d.subjectConfirmationNotOnOrAfter) return null;
  const id = 'saml-subjconf';
  if (d.subjectConfirmationMethod && d.subjectConfirmationMethod !== BEARER) {
    return { id, status: 'WARN', title: 'Non-Bearer Subject Confirmation', cause: `Method is ${d.subjectConfirmationMethod}.`, fix: 'Web browser SSO normally uses urn:oasis:names:tc:SAML:2.0:cm:bearer.' };
  }
  const exp = parseDate(d.subjectConfirmationNotOnOrAfter);
  if (exp && now.getTime() >= exp.getTime() + config.clockSkewSeconds * 1000) {
    return { id, status: 'FAIL', title: 'Subject Confirmation Expired', cause: `SubjectConfirmationData NotOnOrAfter was ${describeDate(exp, now)}.`, fix: 'Capture a fresh response, and check clock sync if it fails straight after login.' };
  }
  return { id, status: 'PASS', title: 'Bearer Confirmation Valid', cause: exp ? `Subject confirmation valid until ${describeDate(exp, now)}.` : 'Bearer subject confirmation present.', fix: '' };
}

function checkAudience(d: DecodedSaml, config: ValidationConfig): CheckResult {
  const id = 'saml-audience';
  const expected = config.expectedAudience.trim();
  if (!expected) {
    return { id, status: 'INFO', title: 'Audience Not Checked', cause: d.audiences.length ? `Audience: ${d.audiences.join(', ')}.` : 'No Audience in the Assertion.', fix: 'Set "Expected Audience / Entity ID" in Validation Settings to compare it with your SP Entity ID.' };
  }
  if (!d.audiences.length) {
    return { id, status: 'WARN', title: 'Audience Missing', cause: 'The Assertion has no AudienceRestriction.', fix: 'Configure the IdP to send an Audience equal to your SP Entity ID.' };
  }
  if (!d.audiences.includes(expected)) {
    const near = d.audiences.some((a) => nearHint(a, expected));
    return {
      id,
      status: 'FAIL',
      title: 'Audience Mismatch',
      cause: `Audience ${d.audiences.map((a) => `"${a}"`).join(', ')} does not match expected "${expected}".${near ? ' They differ only in case or a trailing slash.' : ''}`,
      fix: 'Set the Audience / SP Entity ID in the IdP app config to exactly match your SP Entity ID.',
    };
  }
  return { id, status: 'PASS', title: 'Audience Matches', cause: `Audience "${expected}" is present.`, fix: '' };
}

function checkRecipientDestination(d: DecodedSaml, config: ValidationConfig): CheckResult {
  const id = 'saml-acs';
  const expected = config.expectedAcsUrl.trim();
  if (!expected) {
    return { id, status: 'INFO', title: 'ACS URL Not Checked', cause: `Recipient: ${d.recipient || '(none)'}. Destination: ${d.destination || '(none)'}.`, fix: 'Set "Expected ACS URL" in Validation Settings to compare it.' };
  }
  if (d.recipient && d.recipient !== expected) {
    return { id, status: 'FAIL', title: 'Recipient Mismatch', cause: `Recipient "${d.recipient}" does not match expected ACS URL "${expected}".${nearHint(d.recipient, expected)}`, fix: 'Set the ACS / Reply URL in the IdP app config to your SP ACS URL (check http vs https, host, port and path).' };
  }
  if (d.destination && d.destination !== expected) {
    return { id, status: 'FAIL', title: 'Destination Mismatch', cause: `Destination "${d.destination}" does not match expected ACS URL "${expected}".${nearHint(d.destination, expected)}`, fix: 'Set the ACS / Reply URL in the IdP app config to your SP ACS URL.' };
  }
  if (!d.recipient && d.assertionCount > 0) {
    return { id, status: 'WARN', title: 'Recipient Missing', cause: 'SubjectConfirmationData has no Recipient.', fix: 'Bearer assertions must include a Recipient equal to the ACS URL.' };
  }
  return { id, status: 'PASS', title: 'ACS URL Matches', cause: 'Recipient and Destination match the expected ACS URL.', fix: '' };
}

function checkIssuer(d: DecodedSaml, config: ValidationConfig): CheckResult {
  const id = 'saml-issuer';
  const expected = config.expectedIssuer.trim();
  if (!expected) {
    return { id, status: 'INFO', title: 'Issuer Not Checked', cause: `Issuer: ${d.issuer || '(none)'}.`, fix: 'Set "Expected Issuer" in Validation Settings to compare it with the IdP Entity ID configured in your SP.' };
  }
  if (d.issuer !== expected) {
    return { id, status: 'FAIL', title: 'Issuer Mismatch', cause: `Issuer "${d.issuer}" does not match expected "${expected}".${nearHint(d.issuer, expected)}`, fix: 'Update the IdP Entity ID in your SP config (or re-import the IdP metadata).' };
  }
  return { id, status: 'PASS', title: 'Issuer Matches', cause: `Issuer is "${expected}".`, fix: '' };
}

function checkCertificates(d: DecodedSaml, now: Date): CheckResult {
  const id = 'saml-cert';
  if (!d.certificates.length) {
    return { id, status: 'INFO', title: 'No Embedded Certificate', cause: 'The signature has no <X509Certificate>.', fix: 'This is allowed. The SP must then already hold the IdP signing certificate from metadata.' };
  }
  const parsed = d.certificates.filter((c) => c.parsed && c.notAfter);
  if (!parsed.length) {
    return { id, status: 'WARN', title: 'Certificate Unreadable', cause: 'The embedded certificate could not be parsed.', fix: 'Check the certificate in the IdP metadata.' };
  }
  const thirtyDays = 30 * 24 * 3600 * 1000;
  for (const c of parsed) {
    if (c.notAfter! < now) {
      return { id, status: 'FAIL', title: 'Signing Certificate Expired', cause: `Certificate "${c.subject}" expired ${describeDate(c.notAfter!, now)}.`, fix: 'Rotate the IdP signing certificate and upload the new one (or new metadata) to the SP.' };
    }
    if (c.notBefore && c.notBefore > now) {
      return { id, status: 'FAIL', title: 'Certificate Not Yet Valid', cause: `Certificate "${c.subject}" is valid from ${describeDate(c.notBefore, now)}.`, fix: 'Check the IdP certificate dates and clock sync.' };
    }
    if (c.notAfter!.getTime() - now.getTime() < thirtyDays) {
      return { id, status: 'WARN', title: 'Certificate Expiring Soon', cause: `Certificate "${c.subject}" expires ${describeDate(c.notAfter!, now)}.`, fix: 'Plan certificate rotation now, and share the new certificate with the SP ahead of time.' };
    }
  }
  return { id, status: 'PASS', title: 'Certificate Valid', cause: `Valid until ${parsed.map((c) => describeDate(c.notAfter!, now)).join(', ')}. Compare its SHA-256 fingerprint with the one in your SP.`, fix: '' };
}

function checkNameId(d: DecodedSaml): CheckResult {
  const id = 'saml-nameid';
  if (!d.nameId) {
    return { id, status: 'FAIL', title: 'Missing NameID', cause: 'No NameID found in the Assertion Subject.', fix: 'Configure the IdP to send a NameID (commonly the email address or a persistent ID).' };
  }
  const fmt = d.nameIdFormat ? tail(d.nameIdFormat) : 'unspecified';
  if (/emailAddress/i.test(fmt) && !/^[^@\s]+@[^@\s]+$/.test(d.nameId)) {
    return { id, status: 'WARN', title: 'NameID Format Mismatch', cause: `NameID "${d.nameId}" is declared as emailAddress but is not an email.`, fix: 'Map the NameID to the user\'s email in the IdP, or change the declared format.' };
  }
  return { id, status: 'PASS', title: 'NameID Present', cause: `NameID "${d.nameId}" (${fmt}).`, fix: '' };
}

function checkAttributes(d: DecodedSaml): CheckResult {
  const id = 'saml-attrs';
  if (!d.attributes.length) {
    return { id, status: 'WARN', title: 'No Attributes', cause: 'The Assertion has no AttributeStatement.', fix: 'If your SP needs email, name or groups, add attribute mappings in the IdP.' };
  }
  const empty = d.attributes.filter((a) => a.values.every((v) => !v));
  if (empty.length) {
    return { id, status: 'WARN', title: 'Empty Attribute Values', cause: `Attributes with no value: ${empty.map((a) => a.name).join(', ')}.`, fix: 'The user profile field in the IdP is empty, or the mapping points to the wrong source field.' };
  }
  return { id, status: 'PASS', title: 'Attributes Present', cause: `${d.attributes.length} attribute(s): ${d.attributes.map((a) => a.friendlyName || a.name).join(', ')}.`, fix: '' };
}

function checkInResponseTo(d: DecodedSaml): CheckResult {
  const id = 'saml-irt';
  if (!d.inResponseTo) {
    return { id, status: 'INFO', title: 'IdP-Initiated Response', cause: 'No InResponseTo. This is an unsolicited (IdP-initiated) response.', fix: 'If your SP only allows SP-initiated login, start login from the SP. Otherwise enable IdP-initiated SSO in the SP.' };
  }
  return { id, status: 'PASS', title: 'SP-Initiated Response', cause: `InResponseTo "${d.inResponseTo}". The SP must match this with the AuthnRequest ID it sent.`, fix: '' };
}

export function runSamlChecks(decoded: DecodedSaml, config: ValidationConfig, now: Date = new Date()): CheckResult[] {
  const hasAssertion = decoded.assertionCount > 0;
  const results: Array<CheckResult | null> = [
    checkStatus(decoded),
    checkAssertionPresent(decoded),
    checkSignature(decoded),
    checkSignatureAlgorithm(decoded),
    hasAssertion ? checkTimeValidity(decoded, config, now) : null,
    hasAssertion ? checkSubjectConfirmation(decoded, config, now) : null,
    hasAssertion ? checkAudience(decoded, config) : null,
    checkRecipientDestination(decoded, config),
    checkIssuer(decoded, config),
    checkCertificates(decoded, now),
    hasAssertion ? checkNameId(decoded) : null,
    hasAssertion ? checkAttributes(decoded) : null,
    checkInResponseTo(decoded),
  ];
  return results.filter((r): r is CheckResult => r !== null);
}

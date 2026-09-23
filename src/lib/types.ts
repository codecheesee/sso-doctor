/**
 * Result status of a single validation check.
 * INFO is used for checks that were skipped or are purely informational,
 * so they are not counted as a pass.
 */
export type CheckStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface CheckResult {
  id: string;
  status: CheckStatus;
  title: string;
  cause: string;
  fix: string;
}

/**
 * Optional configuration the user provides to compare against token values.
 */
export interface ValidationConfig {
  expectedAudience: string;
  expectedAcsUrl: string;
  expectedIssuer: string;
  clockSkewSeconds: number;
}

export interface SamlAttribute {
  name: string;
  friendlyName: string;
  values: string[];
}

/**
 * Decoded SAML response fields extracted from the XML.
 */
export interface DecodedSaml {
  rootElement: string;
  responseId: string;
  issueInstant: string;
  issuer: string;
  destination: string;
  inResponseTo: string;
  statusCode: string;
  subStatusCode: string;
  statusMessage: string;
  assertionCount: number;
  encryptedAssertion: boolean;
  responseSigned: boolean;
  assertionSigned: boolean;
  signatureAlgorithm: string;
  digestAlgorithm: string;
  nameId: string;
  nameIdFormat: string;
  subjectConfirmationMethod: string;
  subjectConfirmationNotOnOrAfter: string;
  recipient: string;
  notBefore: string;
  notOnOrAfter: string;
  audiences: string[];
  authnInstant: string;
  sessionIndex: string;
  sessionNotOnOrAfter: string;
  authnContextClassRef: string;
  attributes: SamlAttribute[];
  certificates: CertificateInfo[];
  rawXml: string;
  prettyXml: string;
}

export interface CertificateInfo {
  parsed: boolean;
  subject: string;
  issuer: string;
  notBefore: Date | null;
  notAfter: Date | null;
  serialNumber: string;
  sha256Fingerprint: string;
  pem: string;
}

/**
 * Decoded JWT (header + payload + raw signature).
 */
export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  raw: { header: string; payload: string };
}

export type DetectedType = 'jwt' | 'jwe' | 'saml' | 'unknown';

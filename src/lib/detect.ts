import type { DetectedType } from './types';
import { base64UrlToUtf8, normalizeInput, samlInputToXml } from './encoding';

const B64URL_SEGMENT = /^[A-Za-z0-9_-]*$/;

/**
 * Detects whether the given input string is a JWT, a JWE, a SAML message, or unknown.
 */
export function detectTokenType(input: string): DetectedType {
  const s = normalizeInput(input);
  if (!s) return 'unknown';

  const parts = s.split('.');
  if ((parts.length === 3 || parts.length === 5) && parts.every((p) => B64URL_SEGMENT.test(p))) {
    try {
      const header = JSON.parse(base64UrlToUtf8(parts[0]!));
      if (header && typeof header === 'object' && 'alg' in header) {
        return parts.length === 5 || 'enc' in header ? 'jwe' : 'jwt';
      }
    } catch {
      // not a JOSE header
    }
  }

  const xml = samlInputToXml(s);
  if (xml && /<(\w+:)?(Response|Assertion|AuthnRequest|LogoutRequest|LogoutResponse)[\s>]/.test(xml)) {
    return 'saml';
  }

  return 'unknown';
}

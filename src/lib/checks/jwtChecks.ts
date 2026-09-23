import type { CheckResult, DecodedJwt, ValidationConfig } from '../types';
import { describeDate, formatDuration } from '../time';

function numClaim(d: DecodedJwt, key: string): number | undefined {
  const v = d.payload[key];
  return typeof v === 'number' && isFinite(v) ? v : undefined;
}

function checkAlgorithm(d: DecodedJwt): CheckResult {
  const id = 'jwt-alg';
  const alg = String(d.header.alg ?? '');
  if (!alg || alg.toLowerCase() === 'none') {
    return { id, status: 'FAIL', title: 'Unsigned Token (alg: none)', cause: 'The token declares no signing algorithm, so anyone can forge it.', fix: 'Reject alg=none tokens. Configure the issuer to sign with RS256, PS256 or ES256.' };
  }
  if (/^HS/i.test(alg)) {
    return { id, status: 'INFO', title: `Symmetric Algorithm (${alg})`, cause: 'HMAC tokens use a shared secret. Anyone who can verify them can also create them.', fix: 'Fine for first-party APIs. For OIDC or third parties, prefer RS256 or ES256 with a published JWKS.' };
  }
  return { id, status: 'PASS', title: `Algorithm ${alg}`, cause: 'The token uses an asymmetric signing algorithm.', fix: '' };
}

function checkSignaturePresent(d: DecodedJwt): CheckResult {
  const id = 'jwt-sig';
  if (!d.signature) {
    return { id, status: 'FAIL', title: 'Signature Missing', cause: 'The third part of the token is empty.', fix: 'The token was stripped or never signed. Any resource server must reject it.' };
  }
  return { id, status: 'PASS', title: 'Signature Present', cause: 'This tool checks structure only. It does not verify the signature against the issuer keys.', fix: '' };
}

function checkKid(d: DecodedJwt): CheckResult | null {
  const alg = String(d.header.alg ?? '');
  if (!alg || /^HS|^none$/i.test(alg)) return null;
  if (!d.header.kid) {
    return { id: 'jwt-kid', status: 'WARN', title: 'No Key ID (kid)', cause: 'The header has no "kid", so verifiers cannot pick the right key from the JWKS.', fix: 'Most IdPs set kid automatically. Some libraries fail after key rotation without it.' };
  }
  return { id: 'jwt-kid', status: 'PASS', title: 'Key ID Present', cause: `kid "${String(d.header.kid)}". Check it exists in the issuer JWKS.`, fix: '' };
}

function checkExpiration(d: DecodedJwt, config: ValidationConfig, nowSec: number): CheckResult {
  const id = 'jwt-exp';
  const exp = numClaim(d, 'exp');
  if (exp === undefined) {
    return { id, status: 'WARN', title: 'No Expiration (exp)', cause: 'The token has no "exp" claim, so it never expires.', fix: 'Configure the issuer to set a token lifetime.' };
  }
  const now = new Date(nowSec * 1000);
  const expDate = new Date(exp * 1000);
  if (exp + config.clockSkewSeconds <= nowSec) {
    return { id, status: 'FAIL', title: 'Token Expired', cause: `Expired ${describeDate(expDate, now)}.`, fix: 'Get a new token (or use the refresh token). If brand-new tokens fail, check the server clock.' };
  }
  return { id, status: 'PASS', title: 'Not Expired', cause: `Expires ${describeDate(expDate, now)}.`, fix: '' };
}

function checkNotBefore(d: DecodedJwt, config: ValidationConfig, nowSec: number): CheckResult | null {
  const nbf = numClaim(d, 'nbf');
  if (nbf === undefined) return null;
  const id = 'jwt-nbf';
  if (nbf - config.clockSkewSeconds > nowSec) {
    return { id, status: 'FAIL', title: 'Token Not Yet Valid', cause: `nbf is ${describeDate(new Date(nbf * 1000), new Date(nowSec * 1000))}.`, fix: 'The issuer clock is ahead. Sync clocks with NTP or raise the clock skew.' };
  }
  return { id, status: 'PASS', title: 'Not-Before Passed', cause: 'The "nbf" time has passed.', fix: '' };
}

function checkIssuedAt(d: DecodedJwt, config: ValidationConfig, nowSec: number): CheckResult | null {
  const iat = numClaim(d, 'iat');
  if (iat === undefined) return null;
  const id = 'jwt-iat';
  if (iat - config.clockSkewSeconds > nowSec) {
    return { id, status: 'WARN', title: 'Issued in the Future', cause: `iat is ${describeDate(new Date(iat * 1000), new Date(nowSec * 1000))}.`, fix: 'Clock drift between the issuer and this machine. Sync clocks with NTP.' };
  }
  const exp = numClaim(d, 'exp');
  if (exp !== undefined && exp - iat > 24 * 3600) {
    return { id, status: 'WARN', title: 'Long Token Lifetime', cause: `Lifetime is ${formatDuration(exp - iat)}.`, fix: 'Access and ID tokens are usually valid for 5–60 minutes. Long lifetimes raise the impact of a leaked token.' };
  }
  return { id, status: 'PASS', title: 'Issued-At Valid', cause: exp !== undefined ? `Lifetime is ${formatDuration(exp - iat)}.` : 'The token was issued in the past.', fix: '' };
}

function checkAudience(d: DecodedJwt, config: ValidationConfig): CheckResult {
  const id = 'jwt-aud';
  const aud = d.payload.aud;
  const list = typeof aud === 'string' ? [aud] : Array.isArray(aud) ? aud.map(String) : [];
  const expected = config.expectedAudience.trim();
  if (!expected) {
    if (!list.length) {
      return { id, status: 'WARN', title: 'No Audience (aud)', cause: 'The token has no "aud" claim.', fix: 'Tokens should be bound to an audience so they cannot be replayed at other APIs.' };
    }
    return { id, status: 'INFO', title: 'Audience Not Checked', cause: `aud: ${list.join(', ')}.`, fix: 'Set "Expected Audience" in Validation Settings to compare it with your client ID or API identifier.' };
  }
  if (!list.includes(expected)) {
    return { id, status: 'FAIL', title: 'Audience Mismatch', cause: `aud ${list.length ? list.map((a) => `"${a}"`).join(', ') : '(missing)'} does not include "${expected}".`, fix: 'Request the token for the right audience (the "audience"/"resource" parameter or scope), or fix the expected value in your API.' };
  }
  return { id, status: 'PASS', title: 'Audience Matches', cause: `aud includes "${expected}".`, fix: '' };
}

function checkIssuer(d: DecodedJwt, config: ValidationConfig): CheckResult {
  const id = 'jwt-iss';
  const iss = typeof d.payload.iss === 'string' ? d.payload.iss : '';
  const expected = config.expectedIssuer.trim();
  if (!expected) {
    if (!iss) {
      return { id, status: 'WARN', title: 'No Issuer (iss)', cause: 'The token has no "iss" claim.', fix: 'Verifiers need "iss" to find the signing keys.' };
    }
    return { id, status: 'INFO', title: 'Issuer Not Checked', cause: `iss: ${iss}.`, fix: 'Set "Expected Issuer" in Validation Settings to compare it.' };
  }
  if (iss !== expected) {
    const trailing = iss.replace(/\/+$/, '') === expected.replace(/\/+$/, '');
    return { id, status: 'FAIL', title: 'Issuer Mismatch', cause: `iss "${iss || '(missing)'}" does not match "${expected}".${trailing ? ' They differ only by a trailing slash.' : ''}`, fix: 'The issuer must match exactly, including scheme, trailing slash and tenant path.' };
  }
  return { id, status: 'PASS', title: 'Issuer Matches', cause: `iss is "${expected}".`, fix: '' };
}

function checkSubject(d: DecodedJwt): CheckResult {
  const id = 'jwt-sub';
  if (!d.payload.sub) {
    return { id, status: 'WARN', title: 'No Subject (sub)', cause: 'The token has no "sub" claim.', fix: 'Most apps use "sub" as the stable user ID. Client-credentials tokens may use the client ID instead.' };
  }
  return { id, status: 'PASS', title: 'Subject Present', cause: `sub "${String(d.payload.sub)}".`, fix: '' };
}

function checkIdTokenClaims(d: DecodedJwt): CheckResult | null {
  const p = d.payload;
  const looksLikeIdToken = 'nonce' in p || 'at_hash' in p || 'auth_time' in p || 'email' in p;
  if (!looksLikeIdToken) return null;
  const id = 'jwt-profile';
  const missing = ['email', 'name'].filter((k) => !p[k]);
  if (missing.length) {
    return { id, status: 'INFO', title: 'Profile Claims Missing', cause: `Not present: ${missing.join(', ')}.`, fix: 'Request the "profile" and "email" scopes, or add claim mappings in the IdP.' };
  }
  if (p.email_verified === false) {
    return { id, status: 'WARN', title: 'Email Not Verified', cause: 'email_verified is false.', fix: 'Do not trust the email for account linking until it is verified.' };
  }
  return { id, status: 'PASS', title: 'Profile Claims Present', cause: 'email and name are present.', fix: '' };
}

export function runJwtChecks(decoded: DecodedJwt, config: ValidationConfig, now: Date = new Date()): CheckResult[] {
  const nowSec = Math.floor(now.getTime() / 1000);
  return [
    checkAlgorithm(decoded),
    checkSignaturePresent(decoded),
    checkKid(decoded),
    checkExpiration(decoded, config, nowSec),
    checkNotBefore(decoded, config, nowSec),
    checkIssuedAt(decoded, config, nowSec),
    checkAudience(decoded, config),
    checkIssuer(decoded, config),
    checkSubject(decoded),
    checkIdTokenClaims(decoded),
  ].filter((r): r is CheckResult => r !== null);
}

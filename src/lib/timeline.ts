import type { DecodedJwt, DecodedSaml } from './types';
import { parseDate } from './time';

export interface ValidityWindow {
  /** Start of the accepted window (nbf / NotBefore, falling back to issue time). */
  start: Date | null;
  /** End of the accepted window (exp / NotOnOrAfter). */
  end: Date | null;
  /** Named points shown on the timeline. */
  marks: Array<{ label: string; date: Date }>;
}

function fromEpoch(v: unknown): Date | null {
  return typeof v === 'number' && Number.isFinite(v) ? new Date(v * 1000) : null;
}

export function jwtWindow(jwt: DecodedJwt): ValidityWindow | null {
  const iat = fromEpoch(jwt.payload.iat);
  const nbf = fromEpoch(jwt.payload.nbf);
  const exp = fromEpoch(jwt.payload.exp);
  if (!exp) return null;
  const marks = [iat && { label: 'iat', date: iat }, nbf && nbf.getTime() !== iat?.getTime() && { label: 'nbf', date: nbf }, { label: 'exp', date: exp }];
  return { start: nbf ?? iat, end: exp, marks: marks.filter((m): m is { label: string; date: Date } => !!m) };
}

export function samlWindow(saml: DecodedSaml): ValidityWindow | null {
  const issued = parseDate(saml.issueInstant);
  const nb = parseDate(saml.notBefore);
  const end = parseDate(saml.notOnOrAfter) ?? parseDate(saml.subjectConfirmationNotOnOrAfter);
  if (!end) return null;
  const marks = [issued && { label: 'Issued', date: issued }, nb && { label: 'NotBefore', date: nb }, { label: 'NotOnOrAfter', date: end }];
  return { start: nb ?? issued, end, marks: marks.filter((m): m is { label: string; date: Date } => !!m) };
}

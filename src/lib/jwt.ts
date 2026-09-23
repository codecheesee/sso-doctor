import type { DecodedJwt } from './types';
import { base64UrlToUtf8, normalizeInput } from './encoding';

/**
 * Splits the JWT on '.', decodes the header and payload from base64url,
 * parses them as JSON, and returns the raw base64url signature.
 * Throws if the format is invalid.
 */
export function decodeJwt(token: string): DecodedJwt {
  const parts = normalizeInput(token).split('.');

  if (parts.length !== 3) {
    throw new Error(`Invalid JWT format: expected 3 dot-separated parts, found ${parts.length}.`);
  }

  let headerStr: string;
  let payloadStr: string;
  try {
    headerStr = base64UrlToUtf8(parts[0]!);
    payloadStr = base64UrlToUtf8(parts[1]!);
  } catch {
    throw new Error('Failed to decode JWT: header or payload is not valid base64url.');
  }

  let header: unknown;
  let payload: unknown;
  try {
    header = JSON.parse(headerStr);
  } catch {
    throw new Error('Failed to decode JWT: header is not valid JSON.');
  }
  try {
    payload = JSON.parse(payloadStr);
  } catch {
    throw new Error('Failed to decode JWT: payload is not valid JSON (it may be a nested or encrypted token).');
  }

  if (!isRecord(header) || !isRecord(payload)) {
    throw new Error('Failed to decode JWT: header and payload must be JSON objects.');
  }

  return {
    header,
    payload,
    signature: parts[2]!,
    raw: { header: headerStr, payload: payloadStr },
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

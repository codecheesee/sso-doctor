import { inflate, inflateRaw } from 'pako';

/**
 * Cleans up pasted input: strips surrounding quotes, "Bearer " prefixes,
 * "SAMLResponse=" form fields and URL encoding, so users can paste
 * straight from browser dev tools, HAR files or HTTP headers.
 */
export function normalizeInput(input: string): string {
  let s = input.trim();

  s = s.replace(/^["']|["']$/g, '').trim();
  s = s.replace(/^(authorization:\s*)?bearer\s+/i, '').trim();

  // Form-encoded body or query string containing SAMLResponse / id_token / access_token
  const field = s.match(/(?:^|[?&#\s])(SAMLResponse|SAMLRequest|id_token|access_token)=([^&\s]+)/i);
  if (field?.[2]) s = field[2];

  // URL-encoded payloads (e.g. %2B, %3D) copied from the network tab
  if (/%[0-9a-f]{2}/i.test(s)) {
    try {
      s = decodeURIComponent(s);
    } catch {
      // leave as-is
    }
  }

  return s.trim();
}

/** Decodes standard or URL-safe base64 (whitespace tolerant, padding optional) into bytes. */
export function base64ToBytes(input: string): Uint8Array {
  let b64 = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) {
    throw new Error('Input is not valid base64.');
  }
  b64 = b64.replace(/=+$/, '');
  while (b64.length % 4 !== 0) b64 += '=';

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function base64UrlToUtf8(input: string): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(base64ToBytes(input));
}

function looksLikeXml(s: string): boolean {
  return s.trimStart().startsWith('<');
}

/**
 * Turns SAML input into an XML string. Accepts raw XML, base64 XML,
 * or base64 DEFLATE (HTTP-Redirect binding). Returns null if none match.
 */
export function samlInputToXml(input: string): string | null {
  const s = input.trim();
  if (looksLikeXml(s)) return s;

  let bytes: Uint8Array;
  try {
    bytes = base64ToBytes(s);
  } catch {
    return null;
  }

  const plain = bytesToUtf8(bytes);
  if (looksLikeXml(plain)) return plain;

  for (const fn of [inflateRaw, inflate]) {
    try {
      const out = fn(bytes);
      if (out && out.length) {
        const text = bytesToUtf8(out);
        if (looksLikeXml(text)) return text;
      }
    } catch {
      // try next
    }
  }
  return null;
}

export function bytesToHex(bytes: Uint8Array, sep = ''): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0').toUpperCase()).join(sep);
}

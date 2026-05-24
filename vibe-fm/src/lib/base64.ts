const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const lookup = new Uint8Array(256);
for (let i = 0; i < CHARS.length; i++) {
  lookup[CHARS.charCodeAt(i)] = i;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + CHARS[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + '=';
  }
  return out;
}

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[=\s]/g, '');
  const len = clean.length;
  const bufferLength = Math.floor((len * 3) / 4);
  const bytes = new Uint8Array(bufferLength);
  
  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const c1 = lookup[clean.charCodeAt(i)];
    const c2 = lookup[clean.charCodeAt(i + 1)];
    const c3 = i + 2 < len ? lookup[clean.charCodeAt(i + 2)] : 0;
    const c4 = i + 3 < len ? lookup[clean.charCodeAt(i + 3)] : 0;
    
    bytes[p++] = (c1 << 2) | (c2 >> 4);
    if (p < bufferLength) bytes[p++] = ((c2 & 15) << 4) | (c3 >> 2);
    if (p < bufferLength) bytes[p++] = ((c3 & 3) << 6) | c4;
  }
  return bytes;
}

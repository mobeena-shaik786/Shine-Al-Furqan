import path from 'path';

/** Explicit allowlist — anything else is rejected (Critical if bypassed). */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/mpeg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export const MIME_TO_EXTENSION: Record<AllowedMimeType, string> = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
  'audio/webm': '.weba',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};

/** Default 10 MiB. Override with UPLOAD_MAX_BYTES. */
export const DEFAULT_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

/**
 * Detect content type from magic bytes when possible.
 * Returns null if unrecognized (caller may fall back to declared MIME only for empty files).
 */
export function detectMimeFromBuffer(buf: Buffer): AllowedMimeType | null {
  if (buf.length >= 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return 'application/pdf';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buf.length >= 6 && buf.toString('ascii', 0, 6) === 'GIF87a') return 'image/gif';
  if (buf.length >= 6 && buf.toString('ascii', 0, 6) === 'GIF89a') return 'image/gif';
  if (buf.length >= 3 && buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33) {
    return 'audio/mpeg';
  }
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] === 0xfb || buf[1] === 0xf3 || buf[1] === 0xf2)) {
    return 'audio/mpeg';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WAVE'
  ) {
    return 'audio/wav';
  }
  // MP4 / ISO BMFF — ftyp at offset 4
  if (buf.length >= 12 && buf.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }
  // WebM / EBML
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return 'video/webm';
  }
  return null;
}

/** Display-only filename: basename, no path segments, no nulls. */
export function sanitizeDisplayFilename(raw: string): string {
  const base = path.basename(String(raw || 'file').replace(/\0/g, ''));
  const cleaned = base.replace(/[<>:"|?*\\/]/g, '_').trim() || 'file';
  return cleaned.slice(0, 200);
}

/** Reject keys that could escape the upload root. */
export function assertSafeStoredKey(key: string): void {
  if (!key || key.includes('..') || key.includes('/') || key.includes('\\') || path.isAbsolute(key)) {
    throw new Error('Unsafe storage key');
  }
}

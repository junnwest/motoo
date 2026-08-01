/**
 * User-uploaded images (profile pictures, marketplace item covers).
 *
 * **Stored as a data URL in Postgres, not as a file.** motoo has no object
 * storage and no CDN — item thumbnails and creator covers are deliberately
 * code-defined for exactly that reason (DECISIONS 2026-07-19 / 2026-07-29). But
 * a profile picture and a cover photo genuinely have to be *the user's own*
 * image, so the compromise is: the browser downscales and re-encodes the picked
 * file to a small JPEG before it ever leaves the page, and we persist the
 * resulting `data:` URL in an ordinary String column. No bucket, no keys, no
 * dev/prod drift — at the cost of the bytes living in the database, which is
 * why every budget below is small and enforced on BOTH sides (the client
 * encoder aims for it, the server rejects anything over it).
 *
 * Swapping in real object storage later is a contained change: the columns hold
 * a URL either way, so only `toDataUrl` (client) and `parseImageDataUrl`
 * (server) need to change.
 */

/** An image budget: output box, encoder target, and the hard server-side cap. */
export type ImageSpec = {
  /** Max width/height in CSS pixels; the image is center-cropped to this box. */
  width: number;
  height: number;
  /** Rough target for the encoded string, in bytes. The encoder steps quality
   *  down until it fits (or gives up at MIN_QUALITY). */
  targetBytes: number;
  /** Hard limit. Anything larger is rejected server-side, no exceptions. */
  maxBytes: number;
};

/**
 * Profile picture — square, and inlined into the nav on every single page, so
 * it gets the tightest budget of the two.
 */
export const AVATAR_SPEC: ImageSpec = {
  width: 192,
  height: 192,
  targetBytes: 24_000,
  maxBytes: 60_000,
};

/**
 * Marketplace item cover — 16:9, and a creator's market page can show 20+ of
 * them at once, so the per-image budget has to stay small enough that the grid
 * doesn't turn into a multi-megabyte payload.
 */
export const ITEM_COVER_SPEC: ImageSpec = {
  width: 640,
  height: 360,
  targetBytes: 60_000,
  maxBytes: 140_000,
};

/** Formats we accept on the way in. Everything is re-encoded to JPEG. */
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Server-side gate for anything claiming to be an uploaded image. Returns the
 * value if it's a well-formed image data URL within budget, `null` if it's
 * absent or the user cleared it, and throws nothing — a malformed or oversized
 * value is treated as "no image" rather than an error, matching how
 * `thumbnailKey` coerces an unknown slug to null.
 *
 * The client is never trusted here: `toDataUrl` aims for `targetBytes`, but a
 * hand-crafted request could post anything, so this is what actually bounds
 * what lands in the database.
 */
export function parseImageDataUrl(
  value: string | null | undefined,
  spec: ImageSpec,
): string | null {
  if (!value) return null;
  if (!DATA_URL_RE.test(value)) return null;
  // A base64 payload is ~4/3 the size of the bytes it encodes; comparing the
  // string length directly is the conservative check (it over-counts slightly).
  if (value.length > spec.maxBytes) return null;
  return value;
}

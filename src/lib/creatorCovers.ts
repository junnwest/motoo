/**
 * Creator cover art — code-defined, never uploaded. Same thesis as
 * itemThumbnails.ts: a palette-tinted field generated in code, so there's no
 * storage, no CDN, and no moderation surface on a public browse grid.
 *
 * A cover is picked *deterministically from the handle*, so it needs no DB
 * column and no creator action: every existing row gets a distinct, stable
 * cover the moment this ships, and the same creator looks identical on the
 * explore grid, the home spotlight, and their profile.
 *
 * Swapping the monogram for an uploaded image later is a drop-in change inside
 * CreatorCover — nothing else reads these tokens.
 */

/** Tint token → the *static* Tailwind classes Tailwind can see at build time. */
export const COVER_CLASS = {
  coral: { field: "bg-coral-chip", mark: "text-coral-deep", blob: "bg-sand" },
  sage: { field: "bg-sage-bg", mark: "text-sage-text", blob: "bg-cream-warm-2" },
  sand: { field: "bg-sand", mark: "text-coral-deep", blob: "bg-cream-warm-2" },
  cream: {
    field: "bg-cream-warm-2",
    mark: "text-coral-deep",
    blob: "bg-coral-chip",
  },
  warm: { field: "bg-cream-warm", mark: "text-muted-2", blob: "bg-sand" },
} as const;

export type CoverTint = keyof typeof COVER_CLASS;

const TINTS = Object.keys(COVER_CLASS) as CoverTint[];

/**
 * Stable hash (djb2-ish) so a handle always maps to the same tint — server and
 * client render identically, and a creator's cover never shuffles between page
 * loads or between surfaces.
 */
export function resolveCoverTint(handle: string): CoverTint {
  let h = 0;
  for (let i = 0; i < handle.length; i++) {
    h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  }
  return TINTS[h % TINTS.length];
}

/** The glyph on the cover: the display name's first character. */
export function coverMonogram(displayName: string): string {
  return displayName.replace(/^@/, "").trim().charAt(0).toUpperCase() || "?";
}

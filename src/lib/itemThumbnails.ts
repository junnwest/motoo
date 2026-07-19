/**
 * Curated marketplace-item thumbnails. Each "asset" is code-defined — a glyph on
 * a palette-tinted tile — not an uploaded image, so there's no storage, no CDN,
 * and no moderation surface (mirrors how Mochi.tsx / Placeholder.tsx generate
 * visuals rather than store them). An item stores a stable `thumbnailKey`; the
 * renderer maps it to a tile, falling back to a per-itemType default so blank or
 * legacy items still look intentional.
 *
 * The picker groups (투표·참여, 영상·클립, …) line up with the suggestion groups in
 * itemSuggestions.ts. Group + asset labels live in messages/*.json under
 * `creatorDashboard.items.thumbnails.*`.
 */

import { MarketplaceItemType } from "@prisma/client";

/** Background tint token → the *static* Tailwind class Tailwind can see at build. */
export const TINT_CLASS = {
  coral: "bg-coral-chip text-coral-deep",
  sage: "bg-sage-bg text-sage-text",
  sand: "bg-sand text-coral-deep",
  cream: "bg-cream-warm-2 text-coral-deep",
  panel: "bg-panel text-muted-2",
} as const;

export type Tint = keyof typeof TINT_CLASS;

export type ThumbnailAsset = {
  /** Stable slug stored on MarketplaceItem.thumbnailKey. */
  key: string;
  /** Glyph rendered on the tile. */
  emoji: string;
  tint: Tint;
};

export type ThumbnailGroup = {
  /** Stable slug → messages `…thumbnails.groups.<key>`. */
  key: string;
  assets: ThumbnailAsset[];
};

export const THUMBNAIL_GROUPS: ThumbnailGroup[] = [
  {
    key: "participate",
    assets: [
      { key: "vote", emoji: "🗳️", tint: "coral" },
      { key: "game", emoji: "🎮", tint: "coral" },
      { key: "idea", emoji: "💡", tint: "coral" },
      { key: "thumbnail", emoji: "🖼️", tint: "coral" },
      { key: "mission", emoji: "🎯", tint: "coral" },
      { key: "penalty", emoji: "🎲", tint: "coral" },
    ],
  },
  {
    key: "video",
    assets: [
      { key: "clip", emoji: "🎬", tint: "sage" },
      { key: "behind", emoji: "🎥", tint: "sage" },
      { key: "footage", emoji: "📼", tint: "sage" },
      { key: "preview", emoji: "👀", tint: "sage" },
      { key: "sketch", emoji: "✏️", tint: "sage" },
      { key: "note", emoji: "📝", tint: "sage" },
    ],
  },
  {
    key: "recognition",
    assets: [
      { key: "credit", emoji: "📜", tint: "cream" },
      { key: "shoutout", emoji: "📣", tint: "cream" },
      { key: "name", emoji: "🏷️", tint: "cream" },
      { key: "badge", emoji: "🏅", tint: "cream" },
    ],
  },
  {
    key: "goods",
    assets: [
      { key: "letter", emoji: "💌", tint: "sand" },
      { key: "sticker", emoji: "✨", tint: "sand" },
      { key: "gift", emoji: "🎁", tint: "sand" },
    ],
  },
  {
    key: "time",
    assets: [
      { key: "call", emoji: "📞", tint: "panel" },
      { key: "session", emoji: "⏰", tint: "panel" },
    ],
  },
];

/** Flat lookup: key → asset. */
const ASSET_BY_KEY: Record<string, ThumbnailAsset> = Object.fromEntries(
  THUMBNAIL_GROUPS.flatMap((g) => g.assets).map((a) => [a.key, a]),
);

/** Per-itemType fallback when an item has no thumbnailKey. */
const FALLBACK_BY_TYPE: Record<MarketplaceItemType, string> = {
  [MarketplaceItemType.digital]: "clip",
  [MarketplaceItemType.access]: "vote",
  [MarketplaceItemType.physical]: "gift",
  [MarketplaceItemType.session]: "call",
};

/**
 * Resolve an item's thumbnail: its explicit key if valid, else the itemType
 * default. Always returns an asset, so the renderer never has to null-check.
 */
export function resolveThumbnail(
  thumbnailKey: string | null | undefined,
  itemType: MarketplaceItemType,
): ThumbnailAsset {
  if (thumbnailKey && ASSET_BY_KEY[thumbnailKey]) {
    return ASSET_BY_KEY[thumbnailKey];
  }
  return ASSET_BY_KEY[FALLBACK_BY_TYPE[itemType]];
}

/** True if the key names a real curated asset. */
export function isThumbnailKey(key: string): boolean {
  return key in ASSET_BY_KEY;
}

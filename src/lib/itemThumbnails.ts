/**
 * Curated marketplace-item thumbnails. Each "asset" is code-defined — a line
 * icon on a palette-tinted tile — not an uploaded image, so there's no storage,
 * no CDN, and no moderation surface (mirrors how Mochi.tsx generates visuals
 * rather than storing them). An item stores a stable `thumbnailKey`; the
 * renderer maps it to a tile, falling back to a per-itemType default so blank or
 * legacy items still look intentional.
 *
 * Marks are **line icons, never emoji** (DECISIONS 2026-07-29): they inherit the
 * tile's brand color and render identically on every platform, where an emoji
 * font would shift with the OS.
 *
 * The picker groups (투표·참여, 영상·클립, …) line up with the suggestion groups in
 * itemSuggestions.ts. Group + asset labels live in messages/*.json under
 * `creatorDashboard.items.thumbnails.*`.
 */

import type { SVGProps, ComponentType } from "react";
import { MarketplaceItemType } from "@prisma/client";
import {
  IconAward,
  IconCamera,
  IconClock,
  IconDice,
  IconEye,
  IconFilm,
  IconGame,
  IconGift,
  IconIdea,
  IconImage,
  IconMail,
  IconMegaphone,
  IconNote,
  IconPencil,
  IconPhone,
  IconScroll,
  IconSparkle,
  IconTag,
  IconTape,
  IconTarget,
  IconVote,
} from "@/components/ui/Icons";

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
  /** Line icon rendered on the tile (never an emoji). */
  icon: ComponentType<SVGProps<SVGSVGElement>>;
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
      { key: "vote", icon: IconVote, tint: "coral" },
      { key: "game", icon: IconGame, tint: "coral" },
      { key: "idea", icon: IconIdea, tint: "coral" },
      { key: "thumbnail", icon: IconImage, tint: "coral" },
      { key: "mission", icon: IconTarget, tint: "coral" },
      { key: "penalty", icon: IconDice, tint: "coral" },
    ],
  },
  {
    key: "video",
    assets: [
      { key: "clip", icon: IconFilm, tint: "sage" },
      { key: "behind", icon: IconCamera, tint: "sage" },
      { key: "footage", icon: IconTape, tint: "sage" },
      { key: "preview", icon: IconEye, tint: "sage" },
      { key: "sketch", icon: IconPencil, tint: "sage" },
      { key: "note", icon: IconNote, tint: "sage" },
    ],
  },
  {
    key: "recognition",
    assets: [
      { key: "credit", icon: IconScroll, tint: "cream" },
      { key: "shoutout", icon: IconMegaphone, tint: "cream" },
      { key: "name", icon: IconTag, tint: "cream" },
      { key: "badge", icon: IconAward, tint: "cream" },
    ],
  },
  {
    key: "goods",
    assets: [
      { key: "letter", icon: IconMail, tint: "sand" },
      { key: "sticker", icon: IconSparkle, tint: "sand" },
      { key: "gift", icon: IconGift, tint: "sand" },
    ],
  },
  {
    key: "time",
    assets: [
      { key: "call", icon: IconPhone, tint: "panel" },
      { key: "session", icon: IconClock, tint: "panel" },
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

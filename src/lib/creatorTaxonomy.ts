/**
 * Creator taxonomy — the single source of truth for a creator's TYPE (primary,
 * broad) and its dependent CATEGORY (secondary sub-facet). Shared by the creator
 * setup form (dependent dropdown), the server-side validation in createStudio,
 * and the fan-side browse filters (explore + home).
 *
 * Slugs are stable identifiers stored on Streamer.creatorType / Streamer.category.
 * Human labels live in messages/*.json under `creatorTaxonomy.*` (Korean-first,
 * no hardcoded strings).
 */

export const CREATOR_TYPES = ["streamer", "youtuber", "author"] as const;
export type CreatorType = (typeof CREATOR_TYPES)[number];

/** type → its allowed category slugs, in display order. */
export const CATEGORIES_BY_TYPE = {
  streamer: ["virtual", "game", "music", "daily", "study"],
  youtuber: ["game", "music", "vlog", "education", "entertainment"],
  author: ["novel", "webtoon", "illustration", "essay"],
} as const satisfies Record<CreatorType, readonly string[]>;

/** Every category slug used by any type, deduped — for label lookups + browse. */
export const ALL_CATEGORIES: readonly string[] = Array.from(
  new Set(Object.values(CATEGORIES_BY_TYPE).flat()),
);

export function isCreatorType(v: string): v is CreatorType {
  return (CREATOR_TYPES as readonly string[]).includes(v);
}

export function isCategoryForType(type: CreatorType, category: string): boolean {
  return (CATEGORIES_BY_TYPE[type] as readonly string[]).includes(category);
}

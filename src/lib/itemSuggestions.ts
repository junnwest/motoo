/**
 * Suggested marketplace items, keyed on creator TYPE. A starter framework so a
 * creator opening their Studio sees ready-made item templates for their kind of
 * work instead of a blank form. Clicking a suggestion just pre-fills the normal
 * item form (title / description / price / type) — the creator edits and saves,
 * so nothing here is binding.
 *
 * Two levels: each type has GROUPS (broad intent, e.g. "content recommendation")
 * and each group has ITEM templates. Slugs are stable i18n keys; the human copy
 * lives in messages/*.json under `creatorDashboard.items.suggestions.*`
 * (Korean-first, no hardcoded strings). `priceMochi` / `itemType` are seed
 * defaults only.
 */

import { MarketplaceItemType, FulfillmentMode } from "@prisma/client";
import type { CreatorType } from "./creatorTaxonomy";

export type ItemSuggestion = {
  /** Stable slug → messages `…suggestions.items.<key>.{title,desc}`. */
  key: string;
  itemType: MarketplaceItemType;
  /** Seed price in mochi; the creator can change it before saving. */
  priceMochi: number;
  /** Curated thumbnail slug (see lib/itemThumbnails) pre-selected for this item. */
  thumbnailKey: string;
  /** How the redemption settles — instant (e.g. a vote) or a creator request. */
  fulfillment: FulfillmentMode;
};

export type SuggestionGroup = {
  /** Stable slug → messages `…suggestions.groups.<key>`. */
  key: string;
  items: ItemSuggestion[];
};

const { digital, access } = MarketplaceItemType;
const { instant, request } = FulfillmentMode;

export const SUGGESTIONS_BY_TYPE: Record<CreatorType, SuggestionGroup[]> = {
  streamer: [
    {
      key: "streamer_content",
      items: [
        { key: "str_next_game_vote", itemType: access, priceMochi: 10, thumbnailKey: "game", fulfillment: instant },
        { key: "str_genre_vote", itemType: access, priceMochi: 10, thumbnailKey: "vote", fulfillment: instant },
        { key: "str_indie_submit", itemType: access, priceMochi: 15, thumbnailKey: "idea", fulfillment: request },
      ],
    },
    {
      key: "streamer_mission",
      items: [
        { key: "str_penalty_candidate", itemType: access, priceMochi: 15, thumbnailKey: "penalty", fulfillment: request },
        { key: "str_mission_propose", itemType: access, priceMochi: 15, thumbnailKey: "mission", fulfillment: request },
      ],
    },
    {
      key: "streamer_clip",
      items: [
        { key: "str_unseen_clip", itemType: digital, priceMochi: 20, thumbnailKey: "clip", fulfillment: request },
        { key: "str_behind", itemType: digital, priceMochi: 25, thumbnailKey: "behind", fulfillment: request },
      ],
    },
    {
      key: "streamer_mention",
      items: [
        { key: "str_supporter_credit", itemType: digital, priceMochi: 5, thumbnailKey: "credit", fulfillment: instant },
        { key: "str_live_shoutout", itemType: access, priceMochi: 20, thumbnailKey: "shoutout", fulfillment: request },
      ],
    },
  ],

  youtuber: [
    {
      key: "youtuber_plan",
      items: [
        { key: "yt_topic_vote", itemType: access, priceMochi: 10, thumbnailKey: "vote", fulfillment: instant },
        { key: "yt_idea_submit", itemType: access, priceMochi: 15, thumbnailKey: "idea", fulfillment: request },
        { key: "yt_thumbnail_vote", itemType: access, priceMochi: 10, thumbnailKey: "thumbnail", fulfillment: instant },
      ],
    },
    {
      key: "youtuber_content",
      items: [
        { key: "yt_unseen_footage", itemType: digital, priceMochi: 25, thumbnailKey: "footage", fulfillment: request },
        { key: "yt_full_version", itemType: digital, priceMochi: 30, thumbnailKey: "clip", fulfillment: request },
        { key: "yt_making", itemType: digital, priceMochi: 20, thumbnailKey: "behind", fulfillment: request },
      ],
    },
    {
      key: "youtuber_credit",
      items: [
        { key: "yt_ending_credit", itemType: digital, priceMochi: 10, thumbnailKey: "credit", fulfillment: request },
        { key: "yt_shoutout", itemType: digital, priceMochi: 20, thumbnailKey: "shoutout", fulfillment: request },
      ],
    },
  ],

  author: [
    {
      key: "author_direction",
      items: [
        { key: "au_plot_vote", itemType: access, priceMochi: 10, thumbnailKey: "vote", fulfillment: instant },
        { key: "au_setting_submit", itemType: access, priceMochi: 15, thumbnailKey: "idea", fulfillment: request },
        { key: "au_spinoff_submit", itemType: access, priceMochi: 15, thumbnailKey: "note", fulfillment: request },
      ],
    },
    {
      key: "author_process",
      items: [
        { key: "au_preview", itemType: digital, priceMochi: 20, thumbnailKey: "preview", fulfillment: request },
        { key: "au_sketch", itemType: digital, priceMochi: 20, thumbnailKey: "sketch", fulfillment: request },
        { key: "au_note", itemType: digital, priceMochi: 10, thumbnailKey: "note", fulfillment: request },
      ],
    },
    {
      key: "author_mention",
      items: [
        { key: "au_supporter_credit", itemType: digital, priceMochi: 5, thumbnailKey: "credit", fulfillment: instant },
        { key: "au_character_name", itemType: digital, priceMochi: 60, thumbnailKey: "name", fulfillment: request },
      ],
    },
  ],
};

/** Suggestion groups for a creator's type, or [] if the type is unset/unknown. */
export function suggestionsForType(
  creatorType: string | null | undefined,
): SuggestionGroup[] {
  if (!creatorType) return [];
  return SUGGESTIONS_BY_TYPE[creatorType as CreatorType] ?? [];
}

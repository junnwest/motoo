import type { Metadata } from "next";

/**
 * Shared metadata helpers.
 *
 * Until now the app had **exactly one** `metadata` export — the root layout's —
 * and it still described the retired Trust Report thesis. Every page therefore
 * shared one wrong title and description, with no Open Graph tags at all: a
 * creator sharing their page to KakaoTalk got a card pitching a product that no
 * longer exists, with no image. Since the creator page is the product's main
 * shareable unit, that was the organic growth loop being broken at the root.
 */

/**
 * The canonical origin, and it has to be **www**.
 *
 * Vercel serves the app on www and 308s the bare apex to it — `src/proxy.ts`
 * hardcodes the same `PROD_CANONICAL_APEX` for exactly this reason. If OG URLs
 * pointed at the bare apex, every scraper fetch would eat a redirect first, and
 * several (KakaoTalk's among them) handle that poorly or drop the card.
 *
 * Overridable for preview deploys, which have neither host.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.themotoo.com";

/** Absolute URL for a root-relative path, for OG/canonical tags. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * Pages that must never be indexed: everything behind auth, plus the Studio.
 * They contain one person's balances, orders and settings, and nothing on them
 * is useful to a search visitor.
 *
 * `follow` stays true — a private page's *links* are still worth crawling, and
 * `nofollow` would strand any creator page only reachable from a rail.
 */
export const NOINDEX: Metadata["robots"] = {
  index: false,
  follow: true,
};

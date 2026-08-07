import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/metadata";

/**
 * Crawl rules. There was no robots.txt at all, so everything — including the
 * signed-in surfaces — was fair game.
 *
 * The disallow list is belt-and-braces with the per-page `robots: NOINDEX`
 * metadata: those pages are behind auth so a crawler can't reach their content
 * anyway, but naming them here keeps them out of the crawl budget entirely and
 * stops the URLs themselves being indexed from inbound links.
 *
 * The Studio host has no sibling robots.ts — `src/proxy.ts` rewrites
 * studio.themotoo.com into the /studio route group, so this file serves both
 * hosts and `/studio` is disallowed for that reason too.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/home",
        "/profile",
        "/settings",
        "/notifications",
        "/studio",
        "/onboarding",
        "/creator/onboarding",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

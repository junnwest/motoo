import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/metadata";
import { PRELAUNCH } from "@/lib/prelaunch";

/**
 * Sitemap: the static public pages plus every approved creator.
 *
 * Creator pages are the entries that matter — they're the shareable, indexable
 * unit of the product, and there was previously no way for a crawler to
 * discover one except by following a link from /explore (which is itself
 * unpaginated, so at scale most creators would fall off the end of it).
 *
 * Only `approved` creators, matching `getStreamerProfile`: a pending or
 * suspended handle 404s, and listing URLs that 404 is worse than omitting them.
 *
 * Wrapped in try/catch because a sitemap is not worth a 500 — if the database
 * is unreachable, serving the static routes alone is a better outcome than
 * serving nothing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/explore"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/creators"), changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/refund"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/terms"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/privacy"), changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/youth"), changeFrequency: "yearly", priority: 0.3 },
    {
      url: absoluteUrl("/guidelines"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Invite-only: /explore, /creators and every /s/<handle> 307 to the welcome
  // page, so listing them would publish the handles of the creators we have
  // privately approached — to advertise URLs that answer with a redirect. The
  // legal pages and the welcome page are the whole public site until launch.
  if (PRELAUNCH) {
    return staticRoutes.filter(
      (r) => !r.url.endsWith("/explore") && !r.url.endsWith("/creators"),
    );
  }

  try {
    const creators = await prisma.streamer.findMany({
      where: { status: "approved" },
      select: { handle: true, createdAt: true },
    });
    return [
      ...staticRoutes,
      ...creators.map((c) => ({
        url: absoluteUrl(`/s/${c.handle}`),
        lastModified: c.createdAt,
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}

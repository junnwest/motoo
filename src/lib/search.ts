import { prisma } from "@/lib/db";
import { getHiddenStreamerIds } from "@/lib/blocks";

/**
 * Global search (docs/PRELAUNCH.md #27).
 *
 * Search used to exist only inside /explore's own filters, and only over
 * creators — so a fan who remembered an item ("that voice-pack thing") or a
 * post had no way to find it, and the only searchable surface was the one they
 * were least likely to be looking for.
 *
 * Three result sets rather than one merged list. They are not comparable: a
 * creator, a thing you can buy, and something someone wrote have no shared
 * notion of relevance, and inventing one would rank them by accident. Grouping
 * says plainly what each result is.
 *
 * Postgres `contains` with `mode: "insensitive"`, not full-text search: Korean
 * needs a language-specific configuration to tokenise usefully, and a
 * mis-tokenised tsvector returns confidently wrong results where a substring
 * match just returns fewer. Worth revisiting with real query logs.
 */

export const SEARCH_LIMIT = 12;
/** Below this a query matches most of the catalogue; treated as no query. */
export const MIN_QUERY_LENGTH = 2;

export type SearchResults = {
  creators: {
    id: string;
    handle: string;
    displayName: string;
    category: string;
    avatarUrl: string | null;
    supporters: number;
  }[];
  items: {
    id: string;
    title: string;
    priceMochi: number;
    handle: string;
    creatorName: string;
  }[];
  updates: {
    id: string;
    title: string;
    publishedAt: Date;
    handle: string;
    creatorName: string;
  }[];
  empty: boolean;
};

export async function globalSearch(
  rawQuery: string,
  viewerId?: string | null,
): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (q.length < MIN_QUERY_LENGTH) {
    return { creators: [], items: [], updates: [], empty: true };
  }

  const hidden = viewerId ? await getHiddenStreamerIds(viewerId) : [];
  // Every result set is scoped to a live creator. Suspension and a fan's own
  // hides have to hold here too, or search becomes the way around both.
  const liveCreator = {
    status: "approved" as const,
    ...(hidden.length > 0 ? { id: { notIn: hidden } } : {}),
  };

  const [creators, items, updates] = await Promise.all([
    prisma.streamer.findMany({
      where: {
        ...liveCreator,
        OR: [
          { displayName: { contains: q, mode: "insensitive" } },
          { handle: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
          { bio: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { mochiHoldings: { _count: "desc" } },
      take: SEARCH_LIMIT,
      select: {
        id: true,
        handle: true,
        displayName: true,
        category: true,
        avatarUrl: true,
        _count: { select: { mochiHoldings: true } },
      },
    }),

    prisma.marketplaceItem.findMany({
      // The same two filters every listing query carries: the creator's own
      // switch, and the admin takedown.
      where: {
        active: true,
        hiddenAt: null,
        streamer: liveCreator,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { redeemedCount: "desc" },
      take: SEARCH_LIMIT,
      select: {
        id: true,
        title: true,
        priceMochi: true,
        streamer: { select: { handle: true, displayName: true } },
      },
    }),

    prisma.update.findMany({
      // Public posts only. Supporter-only posts are excluded outright rather
      // than listed and locked: a title is itself content, and search would
      // otherwise hand every locked headline to someone who hasn't supported —
      // leaking exactly what the visibility setting exists to withhold. A
      // supporter finds them on the creator's page, where the gate is real.
      where: {
        visibility: "public",
        streamer: liveCreator,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
      orderBy: { publishedAt: "desc" },
      take: SEARCH_LIMIT,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        streamer: { select: { handle: true, displayName: true } },
      },
    }),
  ]);

  return {
    creators: creators.map((c) => ({
      id: c.id,
      handle: c.handle,
      displayName: c.displayName,
      category: c.category,
      avatarUrl: c.avatarUrl,
      supporters: c._count.mochiHoldings,
    })),
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      priceMochi: i.priceMochi,
      handle: i.streamer.handle,
      creatorName: i.streamer.displayName,
    })),
    updates: updates.map((u) => ({
      id: u.id,
      title: u.title,
      publishedAt: u.publishedAt,
      handle: u.streamer.handle,
      creatorName: u.streamer.displayName,
    })),
    empty: creators.length + items.length + updates.length === 0,
  };
}

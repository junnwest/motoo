import { RightRailPanel } from "@/components/RightRailPanel";
import { getHoldingsForBacker } from "@/lib/mochi";
import { getFollowList } from "@/lib/follows";
import { getTrendingCreators } from "@/lib/streamers";
import { getHiddenStreamerIds } from "@/lib/blocks";

/**
 * The persistent right rail — discovery suggestions, mirroring the left
 * Sidebar's "always there" behavior: three independent columns (left nav,
 * middle content that changes per page, right suggestions), all rendered by
 * `ConsumerShell`, none of them page-local. Universal — no per-page
 * exceptions, including a creator's public `/s/[handle]` (that page folded
 * its own Buy Mochi/Report/Updates into its single middle column to make
 * room; see DECISIONS 2026-07-31).
 *
 * Only fetches the discover list — the collapsible shell, header, and grid
 * all live in `RightRailPanel` (a client component; collapse state needs
 * `localStorage`/`usePathname`-style hooks this async server component can't
 * use). Two-up grid, small thumbnails, an instant Follow button per card
 * (DECISIONS 2026-07-31): cards are strictly discover-only (already-
 * followed/held creators are filtered out here), so `initialFollowing` on
 * each card is always false.
 */
export async function RightRail({ backerId }: { backerId: string }) {
  const [holdings, follows] = await Promise.all([
    getHoldingsForBacker(backerId),
    getFollowList(backerId),
  ]);
  const supportedHandles = new Set([
    ...holdings.map((h) => h.streamer.handle),
    ...follows.map((f) => f.handle),
  ]);

  let discover: Awaited<ReturnType<typeof getTrendingCreators>> = [];
  try {
    const trending = await getTrendingCreators();
    // Hidden creators are filtered here rather than in the query, because the
    // trending list is `unstable_cache`d and shared across every user — it
    // cannot be personalised without giving up that cache, which is the whole
    // reason the rail stopped being the most repeated query on the site.
    const hidden = new Set(await getHiddenStreamerIds(backerId));
    discover = trending
      .filter((s) => !supportedHandles.has(s.handle) && !hidden.has(s.id))
      .slice(0, 6);
  } catch {
    discover = [];
  }

  return (
    <RightRailPanel
      items={discover.map((s) => ({
        id: s.id,
        handle: s.handle,
        displayName: s.displayName,
        category: s.category,
      }))}
    />
  );
}

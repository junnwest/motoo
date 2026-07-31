import { SidebarPanel } from "@/components/SidebarPanel";
import { getFollowList } from "@/lib/follows";

/**
 * The persistent left sidebar (DECISIONS 2026-07-30) — a real app frame, not a
 * home-page widget, so it has to keep existing while you navigate: 홈/둘러보기
 * at top, then the following list below. Rendered by ConsumerShell on every
 * signed-in consumer page; never on the Studio host or while signed out.
 *
 * The following list is strictly Follow rows (never merged with
 * MochiHolding) — see src/lib/follows.ts.
 *
 * Only fetches the following list — the collapsible shell, nav links, and
 * active-page highlighting all live in `SidebarPanel` (a client component;
 * `usePathname()` and the collapse toggle's `localStorage` aren't available
 * to this async server component).
 */
export async function Sidebar({ backerId }: { backerId: string }) {
  const following = await getFollowList(backerId);
  return <SidebarPanel following={following} />;
}

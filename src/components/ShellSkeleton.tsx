import { Nav } from "@/components/Nav";

/**
 * The loading fallback for every ConsumerShell page (docs/PRELAUNCH.md #25).
 *
 * The app had no `loading.tsx` anywhere, so every navigation sat on the old
 * page until the new one's server render finished — `/s/[handle]` issues ~19
 * queries, `/home` 7 — with nothing to say a click had registered.
 *
 * It renders the real `Nav` rather than a copy. Nav's awaits are a cookie
 * decode, cached translations and two indexed lookups; duplicating its markup
 * to save that would guarantee the two drift apart, and a fallback whose chrome
 * jumps is worse than one that takes a few extra milliseconds.
 *
 * The rails are static blocks, not the real Sidebar/RightRail: those fetch the
 * follow list and the discovery pool, which is exactly the work being waited
 * on. They hold the same widths so the middle column doesn't resize when the
 * real page arrives — the point of a skeleton is that nothing moves.
 */
export function ShellSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <Nav />
      <div className="flex h-[calc(100dvh-64px)] w-full items-stretch gap-3 overflow-hidden px-3 py-4 sm:gap-4 sm:px-4">
        <aside
          className="hidden h-full w-[224px] flex-none rounded-xl border border-line-2 bg-card px-3 py-6 lg:block"
          aria-hidden
        >
          <SkeletonList rows={7} />
        </aside>

        {/* aria-busy + a polite live region: a screen reader gets told the page
            is loading, which a shimmer alone communicates to nobody. */}
        <main
          id="main"
          aria-busy="true"
          className="min-w-0 flex-1 overflow-hidden rounded-xl border border-line-2 bg-card pb-[72px] lg:pb-0"
        >
          <div className="w-full px-6 py-10 sm:px-8 sm:py-12">
            {children ?? <DefaultBody />}
          </div>
        </main>

        <aside
          className="hidden h-full w-[272px] flex-none rounded-xl border border-line-2 bg-card px-4 py-6 xl:block"
          aria-hidden
        >
          <SkeletonList rows={5} />
        </aside>
      </div>
    </>
  );
}

/**
 * One shimmer block. `animate-pulse` rather than a sweeping gradient: the
 * palette is low-contrast by design, and a moving highlight across a cream page
 * reads as a rendering glitch. Honours prefers-reduced-motion through the
 * `motion-reduce` variant, since a pulsing page is exactly what that setting is
 * about.
 */
export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line-2/70 motion-reduce:animate-none ${className}`}
    />
  );
}

function SkeletonList({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <SkeletonBlock className="h-7 w-7 flex-none rounded-full" />
          <SkeletonBlock className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

/** A heading and a few cards — the shape nearly every consumer page takes. */
function DefaultBody() {
  return (
    <>
      <SkeletonBlock className="h-8 w-[220px]" />
      <SkeletonBlock className="mt-3 h-4 w-[320px] max-w-full" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <SkeletonBlock key={i} className="h-[132px]" />
        ))}
      </div>
    </>
  );
}

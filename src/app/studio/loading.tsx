import { SkeletonBlock } from "@/components/ShellSkeleton";

/**
 * The Studio has its own chrome in `layout.tsx`, so unlike the consumer pages
 * this fallback renders only the console body — the sidebar and top bar stay
 * put, which is the behaviour a loading state should have everywhere and only
 * gets for free here.
 */
export default function Loading() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true">
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_minmax(0,480px)]">
        <div>
          <SkeletonBlock className="h-11 w-[340px] max-w-full" />
          <div className="mt-6 grid auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonBlock key={i} className="h-[92px]" />
            ))}
          </div>
        </div>
        <SkeletonBlock className="h-[280px]" />
      </div>
      <SkeletonBlock className="h-[220px]" />
    </div>
  );
}

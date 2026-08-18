import { ShellSkeleton, SkeletonBlock } from "@/components/ShellSkeleton";

/**
 * Given its own body rather than the default grid: this is the page the
 * skeleton matters most for (~19 queries) and the one whose layout is least
 * like the others — an identity band, then boxed sections. A generic card grid
 * here would reflow into something quite different when the real page landed.
 */
export default function Loading() {
  return (
    <ShellSkeleton>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <SkeletonBlock className="h-[76px] w-[76px] flex-none rounded-full" />
        <div className="flex-1">
          <SkeletonBlock className="h-9 w-[260px] max-w-full" />
          <SkeletonBlock className="mt-3 h-4 w-[180px]" />
        </div>
      </div>
      <SkeletonBlock className="mt-8 h-[220px]" />
      <SkeletonBlock className="mt-6 h-[180px]" />
    </ShellSkeleton>
  );
}

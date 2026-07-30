import {
  COVER_CLASS,
  coverMonogram,
  resolveCoverTint,
} from "@/lib/creatorCovers";

/**
 * A creator's cover art — a tinted field, the brand's soft circles, and the
 * creator's monogram. Replaces the "썸네일" grey box that made every card read
 * as unfinished. Purely presentational (no client hooks), so it renders in
 * server and client components alike.
 */
export function CreatorCover({
  handle,
  displayName,
  className = "",
  markClass = "text-[46px]",
}: {
  handle: string;
  displayName: string;
  className?: string;
  /** Monogram size — scale it up on large surfaces (e.g. the home spotlight). */
  markClass?: string;
}) {
  const tint = COVER_CLASS[resolveCoverTint(handle)];
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden ${tint.field} ${className}`}
    >
      {/* soft static circles — the same decoration language as the hero */}
      <span
        className={`absolute -right-7 -top-8 h-24 w-24 rounded-full ${tint.blob} opacity-70`}
      />
      <span
        className={`absolute -bottom-9 -left-6 h-20 w-20 rounded-full ${tint.blob} opacity-45`}
      />
      <span
        className={`absolute inset-0 flex items-center justify-center ${markClass} font-extrabold tracking-[-0.04em] ${tint.mark} opacity-75`}
      >
        {coverMonogram(displayName)}
      </span>
    </div>
  );
}

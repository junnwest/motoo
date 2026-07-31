import Link from "next/link";

/**
 * A section wrapped in a rounded, flat-fill panel — reference: Spotify's own
 * web player, whose sidebar panels ("Create your first playlist") measure out
 * to `background: rgb(31,31,31)` on a black page, `border-radius: 8px`,
 * `padding: 16px 20px`, **no border at all**. The "box" reads from a flat
 * color one step off the page background, not a stroke.
 *
 * Adapted, not copied: motoo's page is light (cream, not black), and the
 * brand's existing corner language runs rounder (16–24px on every other card)
 * — so this uses `cream-warm-2` as the "one step off cream" fill and 20px
 * radius, matching Section to Section rather than Section to a black-theme
 * app pixel-for-pixel. Same borderless-flat-panel structure, motoo's own
 * proportions. See DECISIONS 2026-07-31.
 */
export function Section({
  title,
  href,
  more,
  className = "",
  children,
}: {
  /** Omit on a page that already has its own <h1> covering the same ground
   * (e.g. a single-list page) — repeating the title right below it reads
   * redundant. */
  title?: string;
  href?: string;
  more?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-[20px] bg-cream-warm-2 p-6 sm:p-7 ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-[19px] font-extrabold tracking-[-0.02em] text-ink sm:text-[21px]">
            {title}
          </h2>
          {href && more && (
            <Link
              href={href}
              className="flex-none text-[13.5px] font-bold text-coral-deep hover:underline"
            >
              {more} →
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

import Link from "next/link";

/**
 * A section heading, bare by default — reference: Spotify's own logged-in web
 * player (screenshotted directly, not guessed). Its content shelves (시작하기,
 * 최근, 금요일의 새 음악을 소개합니다!) are NOT boxed: a bold heading floats
 * directly on the page background, followed by a bare row of individually-
 * shaped item cards. The only genuinely boxed panel on that page is the
 * transient queue drawer — a distinct utility surface, not a content shelf.
 * An earlier version of this component boxed every section; that was reading
 * too much from Spotify's *sidebar promo widget* CSS and not enough from what
 * its actual home page does. See DECISIONS 2026-07-31 (corrected).
 *
 * `boxed` opts back into a flat-fill panel (`cream-warm-2`, no border) for
 * pages that are a form/settings group rather than a content shelf — that's a
 * different UI idiom than what the Spotify reference shows, kept only where
 * it earns its keep (e.g. Settings).
 */
export function Section({
  id,
  title,
  href,
  more,
  boxed = false,
  className = "",
  children,
}: {
  /** Anchor target, so a link can land on this section rather than the top of
   * the page — used by the paged lists on /profile. */
  id?: string;
  /** Omit on a page that already has its own <h1> covering the same ground
   * (e.g. a single-list page) — repeating the title right below it reads
   * redundant. */
  title?: string;
  href?: string;
  more?: string;
  /** Opt into the flat-fill panel look — see the component doc above. */
  boxed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      // Clears the sticky nav when jumped to, the same way the Studio's own
      // sections do.
      className={`${id ? "scroll-mt-24" : ""} ${boxed ? "rounded-xl bg-cream-warm-2 p-6 sm:p-7" : ""} ${className}`}
    >
      {title && (
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink sm:text-xl">
            {title}
          </h2>
          {href && more && (
            <Link
              href={href}
              className="flex-none text-sm font-bold text-coral-deep hover:underline"
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

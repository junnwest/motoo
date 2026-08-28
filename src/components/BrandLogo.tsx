import Link from "next/link";
import { BrandWordmark } from "./BrandWordmark";

/**
 * The brand lockup. Wordmark only — the symbol was retired 2026-08-28, so this
 * is now just the Bauhaus 93 outlines at nav scale.
 *
 * On the Studio host it reads **motoo studio** — the console is a different
 * product surface from the consumer app, and both hosts share one `Nav`, so the
 * wordmark is what tells you which one you're on at a glance. "studio" carries
 * a muted fill inside the SVG (it shares a baseline with "motoo" rather than
 * being a separate element) so it still reads as a suffix, not a second word.
 */
export function BrandLogo({
  href = "/",
  onDark = false,
  studio = false,
}: {
  href?: string;
  onDark?: boolean;
  studio?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center">
      <BrandWordmark
        height={20}
        studio={studio}
        onDark={onDark}
        className={onDark ? "text-cream" : "text-ink"}
      />
    </Link>
  );
}

import Link from "next/link";
import { BrandMark } from "./BrandMark";

/**
 * The brand mark. On the Studio host it reads **motoo studio** — the console is
 * a different product surface from the consumer app, and both hosts share one
 * `Nav`, so the wordmark is what tells you which one you're on at a glance.
 * "studio" is set in the lighter muted weight so "motoo" still reads as the
 * brand rather than the two words competing.
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
    <Link href={href} className="flex items-center gap-[10px]">
      <BrandMark width={23} height={26} />
      <span
        className={`font-wordmark text-2xl font-bold tracking-[-0.01em] ${
          onDark ? "text-cream" : "text-ink"
        }`}
      >
        motoo
        {studio ? (
          <span
            className={`font-wordmark-studio ml-1.5 font-semibold ${
              onDark ? "text-dark-text-3" : "text-muted"
            }`}
          >
            studio
          </span>
        ) : null}
      </span>
    </Link>
  );
}

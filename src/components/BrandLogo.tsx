import Link from "next/link";
import { Mochi } from "./Mochi";

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
      <Mochi width={26} height={21} />
      <span
        className={`text-[24px] font-extrabold tracking-[-0.04em] ${
          onDark ? "text-cream" : "text-ink"
        }`}
      >
        motoo
        {studio ? (
          <span
            className={`ml-1.5 font-bold ${
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

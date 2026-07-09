import Link from "next/link";
import { useTranslations } from "next-intl";
import { BrandLogo } from "./BrandLogo";
import { ButtonLink } from "./ui/Button";

/**
 * Top navigation. Two variants:
 *  - "fan" (default landing) links to Explore + the creator page ("크리에이터용 ↗")
 *  - "creator" (the page we send to creators) links back to the fan side
 * Middle links collapse on mobile; brand + primary CTA always remain.
 */
export function Nav({ variant = "fan" }: { variant?: "fan" | "creator" }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8 md:py-5">
        <BrandLogo href={variant === "creator" ? "/creators" : "/"} />

        <div className="flex items-center gap-4 text-[15px] font-medium text-muted-2 md:gap-[30px]">
          {variant === "fan" ? (
            <>
              <Link href="/explore" className="hidden hover:text-ink sm:inline">
                {t("explore")}
              </Link>
              <Link
                href="/#what-is-mochi"
                className="hidden hover:text-ink md:inline"
              >
                {t("whatIsMochi")}
              </Link>
              <Link
                href="/creators"
                className="hidden items-center gap-[5px] text-muted hover:text-ink sm:flex"
              >
                {t("forCreators")} <span className="text-[12px]">↗</span>
              </Link>
              <Link href="/login" className="font-semibold text-ink">
                {tc("login")}
              </Link>
              <ButtonLink href="/signup" variant="primary" size="md">
                {tc("signup")}
              </ButtonLink>
            </>
          ) : (
            <>
              <Link
                href="/creators#features"
                className="hidden hover:text-ink md:inline"
              >
                {t("features")}
              </Link>
              <Link
                href="/creators#report"
                className="hidden hover:text-ink md:inline"
              >
                {t("trustReport")}
              </Link>
              <Link
                href="/"
                className="hidden items-center gap-[5px] text-muted hover:text-ink sm:flex"
              >
                {t("forFans")} <span className="text-[12px]">↗</span>
              </Link>
              <Link href="/login" className="font-semibold text-ink">
                {tc("login")}
              </Link>
              <ButtonLink href="/apply" variant="primary" size="md">
                {t("applyAsCreator")}
              </ButtonLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

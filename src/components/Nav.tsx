import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { logoutAction } from "@/app/auth-actions";
import { BrandLogo } from "./BrandLogo";
import { Button, ButtonLink } from "./ui/Button";

/**
 * Top navigation. Two variants:
 *  - "fan" (default landing) links to Explore + the creator page ("크리에이터용 ↗")
 *  - "creator" (the page we send to creators) links back to the fan side
 * Middle links collapse on mobile; brand + primary CTA always remain.
 *
 * Auth-aware (server component): reads the session on every page render, so it's
 * always fresh after a sign-in/out redirect. When signed in, the login/signup
 * cluster becomes the user's name + a log-out button (via a server action), plus
 * a dashboard link for creators.
 */
export async function Nav({ variant = "fan" }: { variant?: "fan" | "creator" }) {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const tm = await getTranslations("myMochi");
  const session = await auth();
  const authed = !!session?.user;
  const isCreator = !!session?.user?.creator; // owns a Studio
  const name = session?.user?.nickname ?? session?.user?.name ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-4 sm:px-8 md:py-5">
        <BrandLogo href={variant === "creator" ? "/creators" : "/"} />

        <div className="flex items-center gap-4 text-[15px] font-medium text-muted-2 md:gap-[30px]">
          {variant === "fan" ? (
            authed ? (
              // Signed-in fan: app links only (marketing stays for logged-out).
              <>
                <Link
                  href="/explore"
                  className="hidden hover:text-ink sm:inline"
                >
                  {t("explore")}
                </Link>
                <Link
                  href="/me/mochi"
                  className="hidden hover:text-ink sm:inline"
                >
                  {tm("title")}
                </Link>
              </>
            ) : (
              // Logged-out visitor: marketing links (incl. the creator pitch).
              <>
                <Link
                  href="/explore"
                  className="hidden hover:text-ink sm:inline"
                >
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
              </>
            )
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
            </>
          )}

          {/* Auth cluster */}
          {authed ? (
            <>
              {isCreator ? (
                <Link
                  href="/studio"
                  className="hidden font-semibold text-ink hover:text-coral-deep sm:inline"
                >
                  {t("studio")}
                </Link>
              ) : (
                <Link
                  href="/api/become-creator"
                  className="hidden text-muted hover:text-ink sm:inline"
                >
                  {t("becomeCreator")}
                </Link>
              )}
              {name && (
                <span className="hidden text-[14px] font-semibold text-ink sm:inline">
                  {t("greeting", { name })}
                </span>
              )}
              <form action={logoutAction}>
                <Button type="submit" variant="secondary" size="md">
                  {t("logout")}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-ink">
                {tc("login")}
              </Link>
              {variant === "fan" ? (
                <ButtonLink href="/signup" variant="primary" size="md">
                  {tc("signup")}
                </ButtonLink>
              ) : (
                <ButtonLink
                  href="/api/become-creator"
                  variant="primary"
                  size="md"
                >
                  {t("applyAsCreator")}
                </ButtonLink>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

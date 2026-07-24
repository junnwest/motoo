import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { BrandLogo } from "./BrandLogo";
import { SignupButton } from "./SignupButton";
import { UserMenu, type MenuItem } from "./UserMenu";

/**
 * Top navigation — one bar for every page, section, and user type.
 *
 * Layout is deliberately minimal: brand on the left, a single avatar on the
 * right. Every link (Explore, My mochi, Studio / become-creator, settings, …)
 * and logout live in the avatar's click-to-open dropdown (see UserMenu).
 *
 * It's auth-aware and host-aware (server component): it reads the session and
 * the request host on every render, so it's always fresh after a sign-in/out
 * and shows Studio-context items on `studio.*` and consumer items on the apex.
 * Links are path-relative — the middleware forwards any cross-host ones
 * (e.g. Explore from the Studio host → apex) in a single hop.
 */
export async function Nav() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const tm = await getTranslations("myMochi");
  const tcd = await getTranslations("creatorDashboard");

  const session = await auth();
  const authed = !!session?.user;
  const handle = session?.user?.creator ?? null;
  const name = session?.user?.nickname ?? session?.user?.name ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "@";

  const host = (await headers()).get("host") ?? "";
  const onStudioHost = host.startsWith("studio.");

  // Context-aware dropdown items. Studio host surfaces console actions; the
  // consumer app surfaces fan actions + the creator entry point.
  const items: MenuItem[] = onStudioHost
    ? [
        { label: tcd("settings.title"), href: "/settings" },
        ...(handle ? [{ label: tcd("viewPublic"), href: `/s/${handle}` }] : []),
        { label: t("explore"), href: "/explore" },
      ]
    : [
        { label: t("explore"), href: "/explore" },
        { label: tm("title"), href: "/me/mochi" },
        handle
          ? { label: t("studio"), href: "/studio" }
          : { label: t("becomeCreator"), href: "/api/become-creator" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-8">
        <BrandLogo href="/" />

        {authed ? (
          <UserMenu
            name={name}
            initial={initial}
            subtitle={handle ? `@${handle}` : undefined}
            items={items}
            logoutLabel={t("logout")}
          />
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-[15px] font-semibold text-ink hover:text-coral-deep"
            >
              {tc("login")}
            </Link>
            <SignupButton label={tc("signup")} variant="primary" size="md" />
          </div>
        )}
      </nav>
    </header>
  );
}

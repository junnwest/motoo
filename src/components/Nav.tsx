import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { BrandLogo } from "./BrandLogo";
import { SignupButton } from "./SignupButton";
import { UserMenu, type MenuItem } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { getNotificationsForBacker, getUnreadCount } from "@/lib/notify";

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

  // Notifications are fan-side (order/item/price events) — surfaced on the
  // consumer host only, matching 홈/내 모찌/둘러보기 above.
  const showBell = authed && !onStudioHost;
  const [notifications, unreadCount] = showBell
    ? await Promise.all([
        getNotificationsForBacker(session!.user!.id!, 6),
        getUnreadCount(session!.user!.id!),
      ])
    : [[], 0];

  // Context-aware dropdown items. Studio host surfaces console actions; the
  // consumer app surfaces fan actions + the creator entry point.
  const items: MenuItem[] = onStudioHost
    ? [
        { label: tcd("settings.title"), href: "/settings" },
        ...(handle ? [{ label: tcd("viewPublic"), href: `/s/${handle}` }] : []),
        { label: t("explore"), href: "/explore" },
      ]
    : [
        ...(authed ? [{ label: t("home"), href: "/home" }] : []),
        { label: t("explore"), href: "/explore" },
        { label: tm("title"), href: "/me/mochi" },
        handle
          ? { label: t("studio"), href: "/studio" }
          : { label: t("becomeCreator"), href: "/api/become-creator" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 sm:px-8">
        {/* Signed in on the consumer app, the brand goes to the app home;
            everywhere else it goes to "/" (marketing landing / Studio root). */}
        <BrandLogo href={authed && !onStudioHost ? "/home" : "/"} />

        {authed ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {showBell && (
              <NotificationBell
                items={notifications.map((n) => ({
                  id: n.id,
                  title: n.title,
                  body: n.body,
                  link: n.link,
                  read: n.read,
                  createdAt: n.createdAt.toISOString(),
                }))}
                unreadCount={unreadCount}
                seeAllLabel={t("notifications")}
                emptyLabel={t("notificationsEmpty")}
              />
            )}
            <UserMenu
              name={name}
              initial={initial}
              subtitle={handle ? `@${handle}` : undefined}
              items={items}
              logoutLabel={t("logout")}
            />
          </div>
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

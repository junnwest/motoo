import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { BrandLogo } from "./BrandLogo";
import { SignupButton } from "./SignupButton";
import { UserMenu, type MenuItem } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { StudioPill } from "./StudioPill";
import { Mochi } from "./Mochi";
import { getUnreadCount } from "@/lib/notify";
import { getAvatarUrl, getSession } from "@/lib/session";

/**
 * Top navigation (DECISIONS 2026-07-30 restructure).
 *
 * On the consumer host, signed in: brand · [랭킹 icon] [알림 icon] [스튜디오
 * pill] [avatar]. Ranking and notifications are plain icon-links straight to
 * their dedicated pages — no dropdown preview, unlike the avatar. The Studio
 * pill is **always shown**, creator or not: clicking it either opens the
 * console (a creator) or starts the become-a-creator flow (a fan) — the same
 * routing `/api/become-creator` already did, just promoted from a dropdown
 * link to persistent chrome (mirrors YouTube's own Studio button).
 *
 * The avatar dropdown is now identity-only: Profile, Settings, and My channel
 * (creators only) + logout. 홈/둘러보기 moved into the Sidebar (see
 * ConsumerShell); 내 모찌 moved into Profile.
 *
 * Host-aware: the Studio host keeps its own console-context dropdown
 * (설정/공개 프로필/둘러보기) and none of the consumer-only ranking/notification
 * chrome — but mirrors the consumer nav's pill-button pattern with its own
 * "motoo" pill (same position/style as the consumer Studio pill, just
 * pointing the other way) so there's always a one-click way back to the
 * consumer app (DECISIONS 2026-08-01).
 */
export async function Nav() {
  const t = await getTranslations("nav");
  const tc = await getTranslations("common");
  const tmp = await getTranslations("myProfile");
  const ts = await getTranslations("settings");
  const tcd = await getTranslations("creatorDashboard");

  const session = await getSession();
  const authed = !!session?.user;
  const handle = session?.user?.creator ?? null;
  const name = session?.user?.nickname ?? session?.user?.name ?? "";
  const initial = name.trim().charAt(0).toUpperCase() || "@";

  const host = (await headers()).get("host") ?? "";
  const onStudioHost = host.startsWith("studio.");

  const showConsumerChrome = authed && !onStudioHost;
  // Both are per-account reads the JWT can't carry: the unread count changes
  // constantly, and the avatar is a data URL far past the cookie size limit.
  const [unreadCount, avatarUrl] = await Promise.all([
    showConsumerChrome ? getUnreadCount(session!.user!.id!) : 0,
    authed && session?.user?.id ? getAvatarUrl(session.user.id) : null,
  ]);

  // Studio-host dropdown stays as it was; the consumer dropdown is now
  // identity-only (Profile/Settings/My channel) — everything else moved out
  // to the Sidebar or the Studio pill.
  const items: MenuItem[] = onStudioHost
    ? [
        { label: tcd("settings.title"), href: "/settings" },
        ...(handle ? [{ label: tcd("viewPublic"), href: `/s/${handle}` }] : []),
        { label: t("explore"), href: "/explore" },
      ]
    : [
        { label: tmp("title"), href: "/profile" },
        { label: ts("title"), href: "/settings" },
        ...(handle ? [{ label: tcd("viewPublic"), href: `/s/${handle}` }] : []),
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/90 backdrop-blur">
      <nav className="flex h-16 w-full items-center justify-between px-5 sm:px-8">
        {/* Signed in on the consumer app, the brand goes to the app home;
            everywhere else it goes to "/" (marketing landing / Studio root). */}
        <BrandLogo
          href={authed && !onStudioHost ? "/home" : "/"}
          studio={onStudioHost}
        />

        {authed ? (
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {showConsumerChrome && (
              <>
                {/* The trophy linked to /ranking, which was deleted 2026-08-10:
                    it rendered the same getMyRankings rows /home already shows,
                    linking to the same creator pages. Rank now lives where it
                    is actionable — the /home balance card and the /profile
                    holding — so the nav slot goes back rather than pointing at
                    a duplicate. See DECISIONS 2026-08-10. */}
                <NotificationBell
                  unreadCount={unreadCount}
                  label={t("notifications")}
                />
                <StudioPill
                  studioHandle={handle}
                  label={t("studio")}
                  gate={{
                    title: t("studioGate.title"),
                    body: t("studioGate.body"),
                    confirm: t("studioGate.confirm"),
                    cancel: t("studioGate.cancel"),
                    close: tc("close"),
                  }}
                />
              </>
            )}
            {onStudioHost && (
              <Link
                href="/home"
                className="flex items-center gap-2 rounded-full border border-line-3 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:border-coral hover:text-coral-deep"
              >
                <Mochi width={16} height={13} />
                {t("backToMotoo")}
              </Link>
            )}
            <UserMenu
              name={name}
              initial={initial}
              avatarUrl={avatarUrl}
              subtitle={handle ? `@${handle}` : undefined}
              creatorLabel={handle ? tc("creatorRegistered") : undefined}
              items={items}
              logoutLabel={t("logout")}
            />
          </div>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/login"
              className="text-base font-semibold text-ink hover:text-coral-deep"
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

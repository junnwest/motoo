import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { MobileTabBar } from "@/components/MobileTabBar";
import { getUnreadCount } from "@/lib/notify";

/**
 * The app frame for signed-in consumer pages. Three independent columns
 * (DECISIONS 2026-07-31): a persistent left Sidebar (nav + following) and a
 * persistent right RightRail (discovery suggestions) — universal, no
 * per-page exceptions, including a creator's public `/s/[handle]` (that page
 * folded its own Buy Mochi/Report/Updates into a single middle column to make
 * room). Only the middle (`children`) changes per page. Both rails are
 * `sticky` and flush to the true viewport edge — **not** centered inside a
 * max-width wrapper, which would leave them stranded away from the window
 * edge on any screen wider than the cap. Only the middle column's own content
 * (each page sets its own max-width) is centered; the shell itself spans the
 * full viewport width, same as `Nav`.
 *
 * Used on /home, /explore, /notifications, /profile, /settings,
 * and /s/[handle].
 *
 * Deliberately NOT used on: the logged-out marketing landing (`/`), auth
 * flows (login/signup/onboarding — a sidebar full of nav is a distraction
 * mid-flow), the focused back/pay flow, or anywhere on the Studio host (its
 * own console chrome).
 *
 * Renders no rails when signed out — those same routes stay browsable
 * without an account, just without the chrome. Callers still own their own
 * <Footer/>, appended after this component closes.
 */
export async function ConsumerShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const backerId = session?.user?.id;
  const [t, tmp, unreadCount] = await Promise.all([
    getTranslations("nav"),
    getTranslations("myProfile"),
    backerId ? getUnreadCount(backerId) : 0,
  ]);

  return (
    <>
      <Nav />
      {/* min-h matches the rails' own `calc(100vh-64px)`. A *collapsed* rail is
          a fixed-height strip (it has to be, or its divider line stops short —
          DECISIONS 2026-07-31), while an expanded one is content-sized with a
          max-height. Without a floor here, collapsing a rail on a short page
          made it the tallest item in the row and shoved the footer down by up
          to ~176px. With the floor, the row is never shorter than the strip, so
          the footer sits in the same place whatever the rails are doing. */}
      <div className="flex w-full items-start min-h-[calc(100vh-64px)]">
        {backerId && <Sidebar backerId={backerId} />}
        {/* The `main` landmark and the skip link's target for every consumer
            page, declared once here instead of per page (several pages had no
            landmark at all, and the ones that did nested their own <main>).
            pb below `lg` clears the fixed MobileTabBar, which would otherwise
            sit on top of the last ~56px of every page; zero from `lg` up,
            where the bar is hidden and the Sidebar takes over. */}
        <main id="main" className="min-w-0 flex-1 pb-[72px] lg:pb-0">
          {children}
        </main>
        {backerId && <RightRail backerId={backerId} />}
      </div>
      {backerId && (
        <MobileTabBar
          unreadCount={unreadCount}
          labels={{
            home: t("home"),
            explore: t("explore"),
            notifications: t("notifications"),
            profile: tmp("title"),
          }}
        />
      )}
    </>
  );
}

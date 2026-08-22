import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/session";
import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { MobileTabBar } from "@/components/MobileTabBar";
import { Footer } from "@/components/Footer";
import { getUnreadCount } from "@/lib/notify";

/**
 * The app frame for signed-in consumer pages. Three independent columns
 * (DECISIONS 2026-07-31): a persistent left Sidebar (nav + following) and a
 * persistent right RightRail (discovery suggestions) — universal, no
 * per-page exceptions, including a creator's public `/s/[handle]` (that page
 * folded its own Buy Mochi/Report/Updates into a single middle column to make
 * room). Only the middle (`children`) changes per page.
 *
 * **The shell is one viewport tall and does not scroll.** The middle box is the
 * scroller and each rail scrolls its own content, so the three boxes stay put
 * and keep their bottom edges on screen (2026-08-11). The rails were `sticky`
 * when the page itself scrolled; inside a fixed-height row they simply fill it.
 * The shell spans the full viewport width, same as `Nav`; only the middle
 * column's own content is centered, per page.
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
      {/* Three boxes, not two divider lines. Each rail used to draw its own
          `border-r`/`border-l` while being content-sized, so each line stopped
          wherever that rail's content happened to end — and since the two rails
          hold different amounts, the left and right lines ended at different
          heights (the ragged edge noted in DECISIONS 2026-08-02, left alone
          because the obvious fix was forcing full height and losing the rails'
          scroll behaviour). Boxing sidesteps it: a short box reads as a short
          card, not a truncated line. Gap + padding here so the boxes have air
          to be boxes in; `items-stretch` is what makes the three tops and
          bottoms line up. */}
      {/* The row is exactly one viewport tall and never scrolls; the middle box
          is the scroller (`overflow-y-auto` below), and each rail scrolls its
          own content. That is what makes the three boxes read as boxes: with
          the page scrolling underneath them, they slid out of the window and
          their bottom edges left with them.

          `dvh`, not `vh`: on mobile browsers `100vh` is the tallest the
          viewport ever gets, so a `vh`-sized shell hides its own last rows
          behind the address bar until it collapses. */}
      <div className="flex h-[calc(100dvh-64px)] w-full items-stretch gap-3 overflow-hidden px-3 py-4 sm:gap-4 sm:px-4">
        {backerId && <Sidebar backerId={backerId} />}
        {/* The `main` landmark and the skip link's target for every consumer
            page, declared once here instead of per page (several pages had no
            landmark at all, and the ones that did nested their own <main>).
            pb below `lg` clears the fixed MobileTabBar, which would otherwise
            sit on top of the last ~56px of every page; zero from `lg` up,
            where the bar is hidden and the Sidebar takes over. */}
        {/* All three shell boxes are `bg-card` (white) against the light-orange
            page background (2026-08-20) — was `bg-panel`, deliberately the
            same tone as the page, so inner cards read as "sitting in a
            container" rather than a box-in-a-box. That relationship no longer
            holds now that the page itself is colored: keeping panel's old
            neutral tone here would have left the shell a dull beige floating
            on the new orange, which is the opposite of what a white shell is
            for. */}
        <main
          id="main"
          className="min-w-0 flex-1 overflow-y-auto rounded-xl border border-line-2 bg-card pb-[72px] lg:pb-0"
        >
          {/* Floored to the box's own height so a short page (an empty
              /notifications, a fresh account's /home) can't push the footer
              up into view on load. Without this, `main`'s content — footer
              included — is only as tall as `children`, so a couple of empty-
              state lines put the footer a few hundred px down instead of a
              full scroll away, and it read as a stray element mid-page
              rather than a footer. */}
          <div className="min-h-[calc(100dvh-64px)]">{children}</div>
          {/* The footer lives *inside* the scrolling column rather than under
              the shell. Outside it, a non-scrolling page could never reach it,
              and it spanned the full window width — cutting straight across the
              bottom of three boxes it had nothing to do with. Every consumer
              page used `variant="fan"`, so this is the one place it needs to
              be. Pages outside the shell (landing, auth, legal) still own
              theirs. */}
          <Footer variant="fan" tone="light" />
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

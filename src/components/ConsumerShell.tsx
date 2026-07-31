import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { auth } from "@/auth";

/**
 * The app frame for signed-in consumer pages. Three independent columns
 * (DECISIONS 2026-07-31): a persistent left Sidebar (nav + following) and a
 * persistent right RightRail (discovery suggestions) that stay put across
 * navigation — only the middle (`children`) changes per page. Both rails are
 * `sticky`, so they also stay in view while the middle column scrolls, not
 * just while navigating between pages.
 *
 * Used on /home, /explore, /ranking, /notifications, /profile, /settings,
 * and a creator's public /s/[handle] (left Sidebar only there — see
 * `rightRail` below).
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
  rightRail = true,
}: {
  children: React.ReactNode;
  /** Off on a creator's public profile — that page has its own right column
   * (Buy Mochi, Trust Report, News) and is where money changes hands, so a
   * second rail would crowd the one page that most needs the room. */
  rightRail?: boolean;
}) {
  const session = await auth();
  const backerId = session?.user?.id;

  return (
    <>
      <Nav />
      <div className="mx-auto flex max-w-[1600px] items-start">
        {backerId && <Sidebar backerId={backerId} />}
        <div className="min-w-0 flex-1">{children}</div>
        {backerId && rightRail && <RightRail backerId={backerId} />}
      </div>
    </>
  );
}

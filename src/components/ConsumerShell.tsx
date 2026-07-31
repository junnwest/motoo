import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { RightRail } from "@/components/RightRail";
import { auth } from "@/auth";

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
 * Used on /home, /explore, /ranking, /notifications, /profile, /settings,
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
  const session = await auth();
  const backerId = session?.user?.id;

  return (
    <>
      <Nav />
      <div className="flex w-full items-start">
        {backerId && <Sidebar backerId={backerId} />}
        <div className="min-w-0 flex-1">{children}</div>
        {backerId && <RightRail backerId={backerId} />}
      </div>
    </>
  );
}

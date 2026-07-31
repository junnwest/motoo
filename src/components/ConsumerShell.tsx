import { Nav } from "@/components/Nav";
import { Sidebar } from "@/components/Sidebar";
import { auth } from "@/auth";

/**
 * The app frame for signed-in consumer pages (DECISIONS 2026-07-30): Nav on
 * top, the persistent left Sidebar beside the page's own content. Used on
 * /home, /explore, /ranking, /notifications, /profile, /settings, and a
 * creator's public /s/[handle] — everywhere the sidebar needs to survive
 * navigation rather than flicker in and out per page.
 *
 * Deliberately NOT used on: the logged-out marketing landing (`/`), auth
 * flows (login/signup/onboarding — a sidebar full of nav is a distraction
 * mid-flow), the focused back/pay flow, or anywhere on the Studio host (its
 * own console chrome).
 *
 * Renders no Sidebar when signed out — those same routes stay browsable
 * without an account, just without the rail. Callers still own their own
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
      <div className="mx-auto flex max-w-[1600px]">
        {backerId && <Sidebar backerId={backerId} />}
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </>
  );
}

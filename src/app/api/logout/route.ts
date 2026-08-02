import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * Log out. A **route handler with a native form POST**, deliberately not a
 * server action.
 *
 * A server action logout is intercepted by Next and finished with a client-side
 * router transition, which leaves the current document — and every RSC fetch it
 * has in flight — alive across the sign-out. Those requests still carry the old
 * cookie, and Auth.js re-issues the session cookie on every authenticated
 * request, so one landing just after the sign-out silently signed the user back
 * in (reproduced 3/8 logouts). A native form POST is a real navigation: the
 * browser tears the document down and cancels its pending fetches.
 *
 * The belt to that braces is `Backer.tokenVersion`: bumping it here means even a
 * request that does slip through is rejected by the jwt callback rather than
 * being handed a working session. Either mechanism alone would leave a hole —
 * the navigation can't help a request already on the wire, and the version bump
 * can't stop a stale RSC *render* that was already produced.
 *
 * Lives under /api so the onboarding middleware never runs on it.
 */
export async function POST(req: Request) {
  const session = await auth();
  const id = session?.user?.id;

  if (id) {
    try {
      await prisma.backer.update({
        where: { id },
        data: { tokenVersion: { increment: 1 } },
      });
    } catch {
      // Best-effort: an account deleted mid-session (dev reseed) shouldn't turn
      // logout into an error page. signOut below still clears the cookie.
    }
  }

  await signOut({ redirect: false });

  // 303 so the browser follows with GET — a POST-redirect-GET, not a re-POST.
  return NextResponse.redirect(new URL("/", req.url), 303);
}

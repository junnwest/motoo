import { NextResponse } from "next/server";
import { checkInvite } from "@/lib/invites";
import { INVITE_COOKIE, INVITE_COOKIE_MAX_AGE } from "@/lib/inviteCookie";

/**
 * The invite door: `/join/<token>`.
 *
 * A **Route Handler**, not a page, and that is not a style choice: setting a
 * cookie is only permitted in a Route Handler or a Server Action, so the server
 * component this started as threw at runtime the moment it tried to park the
 * token. Failures redirect to `/join`, which is a page and can render *why*.
 *
 * The cookie — not the URL — is what `signupUser` reads when it actually spends
 * the invite, so the token survives the signup → OAuth → onboarding round-trip
 * the same way `creatorIntent` does, and is never carried in a form field where
 * the caller could edit it. httpOnly for the same reason.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const state = await checkInvite(token);

  if (!state.ok) {
    return NextResponse.redirect(new URL(`/join?e=${state.reason}`, req.url));
  }

  // On to the invitation at /join — not straight into signup. Being handed a
  // form is what a public product does; an invitation should be read first and
  // accepted second. That page's CTA is what continues to /api/become-creator,
  // which sets the creator intent (an invite is only ever for a creator).
  const res = NextResponse.redirect(new URL("/join", req.url));
  res.cookies.set(INVITE_COOKIE, token, {
    httpOnly: true,
    path: "/",
    maxAge: INVITE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
  return res;
}

import { NextResponse } from "next/server";
import { PRELAUNCH } from "@/lib/prelaunch";

/**
 * Single entry for the 후원자 (fan) sign-up CTAs — the mirror of
 * /api/become-creator.
 *
 * Why this exists: /api/become-creator drops a `creatorIntent` cookie that lives
 * for 7 days, and /onboarding persists it onto the Backer row so the combined
 * signup → onboarding → Studio-setup flow survives an OAuth round-trip. Nothing
 * used to clear it, so a visitor who clicked 크리에이터로 시작하기 once and then
 * signed up as a fan was still dragged into /creator/onboarding at the end of
 * fan onboarding. Picking 후원자 is an explicit statement of intent, so it
 * clears the flag before handing off to /signup — creator onboarding is never
 * part of the fan signup flow.
 */
export function GET(req: Request) {
  // Pre-launch is creators-only, so the fan door is closed rather than leading
  // to a signup that `signupUser` would refuse for want of an invite. Home,
  // where the welcome page explains why.
  if (PRELAUNCH) return NextResponse.redirect(new URL("/", req.url));

  const res = NextResponse.redirect(new URL("/signup", req.url));
  res.cookies.delete("creatorIntent");
  return res;
}

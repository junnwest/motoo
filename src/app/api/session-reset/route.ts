import { NextResponse } from "next/server";
import { signOut } from "@/auth";

/**
 * Clears a broken session and returns to /login. Used when a page finds a signed-in
 * session whose Backer no longer exists (e.g. a cookie left over after a dev DB
 * reseed) — signing out here breaks the /onboarding ↔ /login cycle a stale token
 * would otherwise cause. Under /api, so the onboarding middleware never runs on it.
 */
export async function GET(req: Request) {
  await signOut({ redirect: false });
  return NextResponse.redirect(new URL("/login", req.url));
}

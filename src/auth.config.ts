import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";

/**
 * Edge-safe Auth.js config (no Prisma, no Node-only deps) so it can run in
 * middleware. The full config in src/auth.ts spreads this and adds the
 * Prisma-backed `jwt` callback + the real providers.
 *
 * The `authorized` callback is the onboarding gate: a signed-in fan who hasn't
 * completed onboarding is redirected to /onboarding for every page except
 * onboarding itself and the pages it links to.
 *
 * /login and /signup are allowed so a broken/stale session (e.g. a cookie left
 * over after a DB reseed points at a deleted user) can escape to re-auth instead
 * of bouncing /onboarding ↔ /login forever.
 */
const ONBOARDING_ALLOW = [
  "/onboarding",
  "/terms",
  "/privacy",
  "/refund",
  "/login",
  "/signup",
];

/**
 * Is `pathname` reachable by a signed-in-but-not-onboarded user? True for the
 * onboarding page itself and the pages it links to. Shared by the `authorized`
 * callback below and the middleware in src/proxy.ts so the gate has one source
 * of truth.
 */
export function isOnboardingExempt(pathname: string): boolean {
  return ONBOARDING_ALLOW.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export const authConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [], // real providers are added in src/auth.ts (Node runtime)
  callbacks: {
    session({ session, token }) {
      if (token.backerId) {
        session.user.id = token.backerId as string;
        session.user.role = token.role as Role;
        session.user.nickname = token.nickname as string;
        session.user.onboarded = !!token.onboarded;
        session.user.creator = (token.creator as string | null) ?? null;
      }
      return session;
    },
    authorized({ auth, request }) {
      const user = auth?.user;
      if (!user) return true; // not signed in — onboarding isn't forced
      if (user.onboarded) return true;
      if (user.role === "admin") return true; // staff

      if (isOnboardingExempt(request.nextUrl.pathname)) return true;
      return NextResponse.redirect(new URL("/onboarding", request.nextUrl));
    },
  },
} satisfies NextAuthConfig;

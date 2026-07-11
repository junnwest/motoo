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
 */
const ONBOARDING_ALLOW = ["/onboarding", "/terms", "/privacy"];

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
      }
      return session;
    },
    authorized({ auth, request }) {
      const user = auth?.user;
      if (!user) return true; // not signed in — onboarding isn't forced
      if (user.onboarded) return true;
      // Creators onboard via /creator/onboarding; admins are staff.
      if (user.role === "streamer" || user.role === "admin") return true;

      const { pathname } = request.nextUrl;
      const allowed = ONBOARDING_ALLOW.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`),
      );
      if (allowed) return true;
      return NextResponse.redirect(new URL("/onboarding", request.nextUrl));
    },
  },
} satisfies NextAuthConfig;

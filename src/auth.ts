import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Naver from "next-auth/providers/naver";
import Kakao from "next-auth/providers/kakao";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { authConfig } from "./auth.config";

/** Only enable an OAuth provider when its credentials are present (spec §9). */
const oauthProviders = [];
if (process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET) {
  oauthProviders.push(
    Naver({
      clientId: process.env.AUTH_NAVER_ID,
      clientSecret: process.env.AUTH_NAVER_SECRET,
    }),
  );
}
if (process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET) {
  oauthProviders.push(
    Kakao({
      clientId: process.env.AUTH_KAKAO_ID,
      clientSecret: process.env.AUTH_KAKAO_SECRET,
    }),
  );
}
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

// Share the session cookie across subdomains (themotoo.com ↔ studio.themotoo.com)
// so one login works on both. Set AUTH_COOKIE_DOMAIN=.themotoo.com in production;
// leave it unset in dev/preview so cookies stay host-only. Only the session token
// needs the shared domain — CSRF/PKCE cookies (`__Host-` prefixed) forbid Domain
// and stay put on the apex, where all auth flows happen.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN;

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  ...(cookieDomain
    ? {
        cookies: {
          sessionToken: {
            options: {
              domain: cookieDomain,
              path: "/",
              httpOnly: true,
              sameSite: "lax",
              secure: true,
            },
          },
        },
      }
    : {}),
  providers: [
    // Dev-only email + password login against the Backer table.
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const backer = await prisma.backer.findUnique({ where: { email } });
        if (!backer?.passwordHash) return null;
        if (!verifyPassword(password, backer.passwordHash)) return null;
        return {
          id: backer.id,
          email: backer.email,
          name: backer.nickname,
          role: backer.role,
        };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      // ── Revocation gate ────────────────────────────────────────────────
      // Sessions are stateless JWTs, so signing out can only ask the browser to
      // drop the cookie — the token itself stays valid until it expires. That
      // made logout unreliable in a way users actually hit: any request still
      // carrying the old cookie (an in-flight RSC fetch, a queued prefetch) got
      // a working session back, and Auth.js re-issues the cookie on *every*
      // authenticated request, so the browser got silently signed back in.
      // Reproduced 3/8 logouts. See DECISIONS 2026-08-02.
      //
      // Logout increments `tokenVersion`; a token carrying a stale version is
      // rejected here. Returning null ends the session, so a straggling request
      // is rejected instead of re-planting the cookie — and a token captured
      // before logout stops working immediately instead of lasting until its
      // 30-day expiry.
      //
      // A counter, not an issued-at cutoff: `iat` has second granularity, so a
      // cutoff would either reject a token minted in the same second as the
      // logout (breaking log-out-then-straight-back-in) or let stragglers
      // through for up to a second (which is exactly the window being closed).
      //
      // Skipped on sign-in (`user` is set), where the token is being minted by
      // this very call and `token.ver` is assigned below.
      if (!user && token.backerId) {
        const row = await prisma.backer.findUnique({
          where: { id: token.backerId as string },
          select: { tokenVersion: true },
        });
        // No row = the account is gone (e.g. a dev reseed). That already
        // self-heals via /api/session-reset, so don't also kill it here.
        if (row && token.ver !== row.tokenVersion) return null;
      }

      // On sign-in, ensure a Backer exists (OAuth users are provisioned lazily).
      if (user?.email) {
        const email = user.email.toLowerCase();
        const backer = await prisma.backer.upsert({
          where: { email },
          update: {},
          create: {
            email,
            nickname: user.name ?? email.split("@")[0],
            avatarUrl: user.image ?? null,
          },
        });
        token.backerId = backer.id;
        token.ver = backer.tokenVersion; // revocation stamp, checked above
        token.role = backer.role;
        token.nickname = backer.nickname;
        token.onboarded = !!backer.onboardedAt;
        // Additive creator capability = does this account own a Studio (Streamer)?
        const studio = await prisma.streamer.findUnique({
          where: { ownerId: backer.id },
          select: { handle: true },
        });
        token.creator = studio?.handle ?? null;
      }
      // Refresh the onboarded flag while it's still false (cheap: the query stops
      // once true). This flips the token after /onboarding completes — the
      // completeOnboarding action calls unstable_update() to trigger it.
      if (token.backerId && !token.onboarded) {
        const b = await prisma.backer.findUnique({
          where: { id: token.backerId as string },
          select: { onboardedAt: true, nickname: true },
        });
        token.onboarded = !!b?.onboardedAt;
        if (b?.nickname) token.nickname = b.nickname;
      }
      // Re-check creator status on explicit refresh — the become-a-creator action
      // calls unstable_update() so the new Studio shows up without re-login.
      if (trigger === "update" && token.backerId) {
        const studio = await prisma.streamer.findUnique({
          where: { ownerId: token.backerId as string },
          select: { handle: true },
        });
        token.creator = studio?.handle ?? null;
      }
      return token;
    },
  },
});

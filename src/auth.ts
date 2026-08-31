import NextAuth from "next-auth";
import { cookies } from "next/headers";
import { PRELAUNCH } from "@/lib/prelaunch";
import { INVITE_COOKIE } from "@/lib/inviteCookie";
import { checkInvite, redeemInvite } from "@/lib/invites";
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

// The session-cookie domain now lives in `auth.config.ts`, which BOTH this Node
// instance and the edge middleware import. It used to be configured here only,
// so the edge re-issued the cookie without a domain and logout could not clear
// the host-only duplicate it left behind. See the note in auth.config.ts.

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
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
    /**
     * Pre-launch invite gate for **OAuth**.
     *
     * `signupUser` gates the credentials path, but OAuth users are provisioned
     * lazily in the `jwt` callback below — they never touch that action, so
     * without this a stranger could open the public `/login`, click "Google로
     * 계속하기" and have an account while the product is supposed to be
     * invite-only. `/login` has to stay public (invited creators need to sign
     * back in), so the check belongs here rather than in the middleware.
     *
     * Only **new** accounts are gated. An existing account signing in again is
     * always allowed: they already redeemed an invite, and locking out the
     * creators we recruited would be worse than the hole.
     */
    async signIn({ user, account }) {
      if (!PRELAUNCH) return true;
      const isOAuth = account?.type === "oauth" || account?.type === "oidc";
      if (!isOAuth) return true; // credentials → signupUser already gated it

      const email = user?.email?.toLowerCase();
      if (!email) return false;

      const existing = await prisma.backer.findUnique({
        where: { email },
        select: { id: true },
      });
      if (existing) return true;

      const token = (await cookies()).get(INVITE_COOKIE)?.value;
      if (!token) return false;
      const state = await checkInvite(token);
      return state.ok;
    },
    async jwt({ token, user, trigger, account }) {
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
        // An OAuth sign-in *is* proof of the address: Google and Naver only
        // hand over an email the account owner has already confirmed to them.
        // Recording that matters now that donating requires a verified address
        // (assertCanPurchase) — without it, the users whose email is most
        // certainly real would be the ones blocked, and mailing them a
        // confirmation link for an address they just proved they control would
        // be a rude way to ask a question we already know the answer to.
        //
        // `update` only ever sets it, never clears it, so a credentials user
        // who later links the same address does not lose their verification.
        const viaOAuth = account?.type === "oauth" || account?.type === "oidc";
        // Find-then-create rather than upsert: during pre-launch we have to
        // know whether this sign-in *created* the account, because that is the
        // moment the invite is spent and the founding mark is set. An upsert
        // cannot tell us which branch it took.
        // Full row, not a narrow select: everything below (tokenVersion, role,
        // nickname, onboardedAt, pendingDeletionAt) reads off it.
        const before = await prisma.backer.findUnique({ where: { email } });
        const backer =
          before ??
          (await prisma.backer.create({
            data: {
              email,
              nickname: user.name ?? email.split("@")[0],
              avatarUrl: user.image ?? null,
              ...(viaOAuth ? { emailVerifiedAt: new Date() } : {}),
            },
          }));

        // New OAuth account during pre-launch: spend the invite that the
        // signIn callback above already validated. Same single-use guard as
        // the credentials path (src/lib/invites.ts).
        if (PRELAUNCH && !before) {
          const inviteToken = (await cookies()).get(INVITE_COOKIE)?.value;
          if (inviteToken) {
            await redeemInvite(inviteToken, backer.id).catch(() => false);
          }
        }
        // Guarded on `null` so signing in again does not keep rewriting the
        // timestamp — "verified at" should mean when it was first proven, not
        // when they last logged in.
        if (viaOAuth) {
          await prisma.backer.updateMany({
            where: { id: backer.id, emailVerifiedAt: null },
            data: { emailVerifiedAt: new Date() },
          });
        }
        // Signing back in *is* the cancellation gesture for a scheduled
        // deletion — the user shouldn't have to find a setting to undo it, and
        // returning to the product is the clearest possible statement of
        // intent. Done here so it applies to every provider at once.
        if (backer.pendingDeletionAt) {
          await prisma.backer.update({
            where: { id: backer.id },
            data: { pendingDeletionAt: null },
          });
        }

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

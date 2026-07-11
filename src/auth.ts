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
    async jwt({ token, user, trigger }) {
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

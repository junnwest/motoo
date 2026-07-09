import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Naver from "next-auth/providers/naver";
import Kakao from "next-auth/providers/kakao";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@prisma/client";

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

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
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
    async jwt({ token, user }) {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token.backerId) {
        session.user.id = token.backerId as string;
        session.user.role = token.role as Role;
        session.user.nickname = token.nickname as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

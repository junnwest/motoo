import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      nickname: string;
      onboarded: boolean;
      // Additive creator capability: the handle of the Studio (Streamer) this
      // account owns, or null. Everyone is a user; creators also own a Studio.
      creator: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backerId?: string;
    role?: Role;
    nickname?: string;
    onboarded?: boolean;
    creator?: string | null;
  }
}

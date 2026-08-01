import { auth } from "@/auth";
import { prisma } from "./db";

/**
 * Resolve the current backer (account) from the session.
 *
 * DEV FALLBACK: when no one is signed in and we're not in production, we fall
 * back to the seeded demo backer (demo@motoo.dev) so the buy/spend flows can be
 * exercised end-to-end before the full login UI lands. Real auth (credentials +
 * Naver/Kakao/Google) is wired in src/auth.ts and takes over in production.
 */
export async function getCurrentBacker() {
  const session = await auth();
  if (session?.user?.id) {
    return prisma.backer.findUnique({ where: { id: session.user.id } });
  }
  if (process.env.NODE_ENV !== "production") {
    return prisma.backer.findUnique({ where: { email: "demo@motoo.dev" } });
  }
  return null;
}

/**
 * Just the profile picture for one account. A separate one-column read because
 * the nav renders on every page and the avatar can't ride in the JWT — it's a
 * data URL (see `Backer.avatarUrl`), which would blow past the session-cookie
 * size limit. Returns null for the monogram fallback.
 */
export async function getAvatarUrl(backerId: string): Promise<string | null> {
  const row = await prisma.backer.findUnique({
    where: { id: backerId },
    select: { avatarUrl: true },
  });
  return row?.avatarUrl ?? null;
}

/**
 * Resolve the creator profile (Streamer) operated by the current account, if any.
 * A creator account is a Backer (role=streamer) that owns a Streamer via
 * Streamer.owner. Returns null for plain users.
 *
 * DEV FALLBACK: mirrors getCurrentBacker — when nobody's signed in outside
 * production, fall back to the seeded demo creator (creator@motoo.dev) so the
 * creator dashboard is demoable without a login round-trip.
 */
export async function getCurrentCreator() {
  const session = await auth();
  if (session?.user?.id) {
    return prisma.streamer.findUnique({
      where: { ownerId: session.user.id },
    });
  }
  if (process.env.NODE_ENV !== "production") {
    const demo = await prisma.backer.findUnique({
      where: { email: "creator@motoo.dev" },
    });
    if (demo) {
      return prisma.streamer.findUnique({ where: { ownerId: demo.id } });
    }
  }
  return null;
}

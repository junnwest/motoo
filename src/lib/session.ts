import { auth } from "@/auth";
import { prisma } from "./db";

/**
 * Resolve the current backer from the session.
 *
 * DEV FALLBACK: when no one is signed in and we're not in production, we fall
 * back to the seeded demo backer (demo@motoo.dev) so the backing flow can be
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

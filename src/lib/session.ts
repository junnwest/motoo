import { cache } from "react";
import { auth } from "@/auth";

/**
 * Per-request session read.
 *
 * `auth()` is not free: every call re-runs the Auth.js `jwt` callback, which
 * hits Backer for the tokenVersion revocation check (and again while
 * `onboarded` is still false) plus Streamer for the creator handle. It was
 * being called independently by Nav, ConsumerShell, and each page — five times
 * on a creator page, so ~10 avoidable queries per render. Deduplicated here;
 * prefer this over importing `auth` directly in a server component.
 */
export const getSession = cache(async () => auth());
import { prisma } from "./db";

/**
 * Resolve the current backer (account) from the session.
 *
 * DEV FALLBACK: when no one is signed in and we're not in production, we fall
 * back to the seeded demo backer (demo@motoo.dev) so the buy/spend flows can be
 * exercised end-to-end before the full login UI lands. Real auth (credentials +
 * Naver/Kakao/Google) is wired in src/auth.ts and takes over in production.
 */
export const getCurrentBacker = cache(async () => {
  const session = await getSession();
  if (session?.user?.id) {
    return prisma.backer.findUnique({ where: { id: session.user.id } });
  }
  if (process.env.NODE_ENV !== "production") {
    return prisma.backer.findUnique({ where: { email: "demo@motoo.dev" } });
  }
  return null;
});

/**
 * Just the profile picture for one account. A separate one-column read because
 * the nav renders on every page and the avatar can't ride in the JWT — it's a
 * data URL (see `Backer.avatarUrl`), which would blow past the session-cookie
 * size limit. Returns null for the monogram fallback.
 */
export const getAvatarUrl = cache(async (backerId: string): Promise<string | null> => {
  // Reuses `getCurrentBacker`'s cached row instead of issuing its own read.
  //
  // Measured with DEBUG_QUERIES=1 (docs/PRELAUNCH.md #35): every signed-in
  // consumer page was doing three Backer.findUnique — the auth callback's
  // tokenVersion check, the page's own getCurrentBacker, and this. The
  // one-column select was there to avoid loading the whole row, but the row's
  // bulk *is* avatarUrl (a data URL), so it was saving nothing and costing a
  // round trip on every page.
  //
  // Falls back to its own read when the id is not the signed-in account, which
  // is the case this signature still has to support.
  const me = await getCurrentBacker();
  if (me?.id === backerId) return me.avatarUrl ?? null;

  const row = await prisma.backer.findUnique({
    where: { id: backerId },
    select: { avatarUrl: true },
  });
  return row?.avatarUrl ?? null;
});

/**
 * Resolve the creator profile (Streamer) operated by the current account, if any.
 * A creator account is a Backer (role=streamer) that owns a Streamer via
 * Streamer.owner. Returns null for plain users.
 *
 * DEV FALLBACK: mirrors getCurrentBacker — when nobody's signed in outside
 * production, fall back to the seeded demo creator (creator@motoo.dev) so the
 * creator dashboard is demoable without a login round-trip.
 */
export const getCurrentCreator = cache(async () => {
  const session = await getSession();
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
});

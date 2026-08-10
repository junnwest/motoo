"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Follow mutations. Split out of `lib/follows.ts` so that module can drop its
 * file-level "use server" and cache its reads: `getFollowList` runs twice on
 * every signed-in page (Sidebar + RightRail) and was issuing the same query
 * both times. This action is imported by client components, so it has to live
 * in a file whose top-level directive marks it as a Server Action - an inline
 * one inside a module a Client Component imports is rejected by the compiler.
 */
/** Toggle follow for the signed-in user. Returns the new state. */
export async function toggleFollow(
  streamerId: string,
  handle: string,
): Promise<{ ok: true; following: boolean } | { ok: false; error: string }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "signedOut" };
  if (!(await checkRateLimit("follow", backer.id))) {
    return { ok: false, error: "tooMany" };
  }

  const existing = await prisma.follow.findUnique({
    where: { streamerId_backerId: { streamerId, backerId: backer.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { streamerId, backerId: backer.id } });
  }

  // Sidebar's following list and RightRail's discovery pool (which excludes
  // already-followed creators) render on every ConsumerShell page, not just
  // /home — revalidate them all so an instant-follow from the rail is
  // reflected regardless of which page it happened on.
  revalidatePath(`/s/${handle}`);
  revalidatePath("/home");
  revalidatePath("/explore");
  revalidatePath("/notifications");
  revalidatePath("/profile");
  revalidatePath("/settings");
  return { ok: true, following: !existing };
}

"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { hashPassword, verifyPassword, PASSWORD_RE } from "@/lib/password";
import { unstable_update } from "@/auth";
import { AVATAR_SPEC, parseImageDataUrl } from "@/lib/imageUpload";

type ActionResult = { ok: true } | { ok: false; error: string };

const HANDLE_RE = /^[a-z0-9_]{2,20}$/;

const identitySchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  handle: z.string().trim().toLowerCase().regex(HANDLE_RE),
});

/** Update nickname + public @handle. Handle uniqueness enforced by the DB. */
export async function updateIdentity(input: {
  nickname: string;
  handle: string;
}): Promise<ActionResult> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "generic" };

  const parsed = identitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  try {
    await prisma.backer.update({
      where: { id: backer.id },
      data: { nickname: parsed.data.nickname, handle: parsed.data.handle },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "handleTaken" };
    }
    return { ok: false, error: "generic" };
  }

  // Nickname rides in the JWT (shown in Nav/UserMenu without a DB hit) —
  // refresh it so the change shows up without a re-login.
  await unstable_update({});
  revalidatePath("/settings");
  revalidatePath("/profile");
  return { ok: true };
}

/**
 * Set or clear the profile picture. The value is a JPEG data URL the browser
 * already downscaled (see `ImagePicker`), but the client is never trusted for
 * it: anything that isn't a well-formed image data URL within `AVATAR_SPEC`'s
 * byte cap is coerced to null, so a hand-crafted request can't park an
 * arbitrary blob in the row.
 *
 * Revalidates every ConsumerShell page — the avatar renders in the nav, which
 * is on all of them, so a stale cache would show the old picture until the next
 * hard navigation.
 */
export async function updateAvatar(
  avatarUrl: string | null,
): Promise<ActionResult> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "generic" };

  // A non-null input that fails validation is a rejection, not a silent clear —
  // otherwise an oversized upload would look like it "removed" the picture.
  const parsed = parseImageDataUrl(avatarUrl, AVATAR_SPEC);
  if (avatarUrl && !parsed) return { ok: false, error: "imageRejected" };

  try {
    await prisma.backer.update({
      where: { id: backer.id },
      data: { avatarUrl: parsed },
    });
  } catch {
    return { ok: false, error: "generic" };
  }

  for (const path of [
    "/settings",
    "/profile",
    "/home",
    "/explore",
    "/ranking",
    "/notifications",
  ]) {
    revalidatePath(path);
  }
  return { ok: true };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().regex(PASSWORD_RE),
});

/**
 * Change password — requires the current one. Only reachable for accounts that
 * already have a passwordHash; OAuth-only accounts never see this form (the
 * settings page checks `backer.passwordHash` before rendering it).
 */
export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult> {
  const backer = await getCurrentBacker();
  if (!backer || !backer.passwordHash) return { ok: false, error: "generic" };

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) {
    if (!PASSWORD_RE.test(input.newPassword ?? "")) {
      return { ok: false, error: "weakPassword" };
    }
    return { ok: false, error: "generic" };
  }

  if (!verifyPassword(parsed.data.currentPassword, backer.passwordHash)) {
    return { ok: false, error: "wrongPassword" };
  }

  await prisma.backer.update({
    where: { id: backer.id },
    data: { passwordHash: hashPassword(parsed.data.newPassword) },
  });
  return { ok: true };
}

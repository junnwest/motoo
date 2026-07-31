"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { hashPassword, verifyPassword, PASSWORD_RE } from "@/lib/password";
import { unstable_update } from "@/auth";

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

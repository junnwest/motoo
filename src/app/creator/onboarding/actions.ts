"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { unstable_update } from "@/auth";

/**
 * Create a Studio (Streamer) for the CURRENT signed-in user. Becoming a creator
 * is additive — it does not create a new account and never re-asks identity
 * (the user already signed up + verified). On success the JWT is refreshed so
 * session.user.creator reflects the new Studio, then we land in /studio.
 */
const setupSchema = z.object({
  displayName: z.string().trim().min(1).max(60),
  handle: z
    .string()
    .trim()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  category: z.enum(["game", "music", "virtual", "daily", "study"]),
  creatorType: z.string().max(60).optional().default(""),
  bio: z.string().max(500).optional().default(""),
  mochiPriceKrw: z.coerce.number().int().positive(),
  mochiGoal: z.coerce.number().int().positive(),
});

export type CreatorSetupInput = z.input<typeof setupSchema>;

export async function createStudio(
  input: CreatorSetupInput,
): Promise<{ ok: false; error: string } | never> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;
  const handle = data.handle.toLowerCase();

  const user = await getCurrentBacker();
  if (!user) return { ok: false, error: "generic" };

  // Already a creator? Just go to the Studio.
  const existing = await prisma.streamer.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/studio");

  try {
    await prisma.$transaction(async (tx) => {
      const streamer = await tx.streamer.create({
        data: {
          handle,
          displayName: data.displayName,
          bio: data.bio,
          category: data.category,
          creatorType: data.creatorType,
          status: "approved",
          subMerchantId: `sub_${handle}`,
          ownerId: user.id,
        },
      });
      await tx.mochiIssuance.create({
        data: {
          streamerId: streamer.id,
          pricePerMochiKrw: data.mochiPriceKrw,
          goalQuantity: data.mochiGoal,
          soldQuantity: 0,
          active: true,
        },
      });
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "handleTaken" };
    }
    return { ok: false, error: "generic" };
  }

  // Refresh the JWT so the nav shows the Studio link immediately (no re-login).
  await unstable_update({});
  redirect("/studio");
}

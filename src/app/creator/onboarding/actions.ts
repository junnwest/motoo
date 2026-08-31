"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { unstable_update } from "@/auth";
import { CREATOR_TYPES, isCategoryForType } from "@/lib/creatorTaxonomy";
import { validateIssuance } from "@/lib/issuance";
import { parseImageDataUrl, AVATAR_SPEC } from "@/lib/imageUpload";

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
  creatorType: z.enum(CREATOR_TYPES),
  category: z.string().trim().min(1),
  bio: z.string().max(500).optional().default(""),
  // A cropped data URL from ImagePicker, or null. Validated server-side by
  // parseImageDataUrl below — never trusted from the client, which is the whole
  // point of that gate (jpeg/png/webp only, never svg, hard byte cap).
  avatarUrl: z.string().nullable().optional(),
  mochiPriceKrw: z.coerce.number().int(),
  mochiGoal: z.coerce.number().int(),
});

export type CreatorSetupInput = z.input<typeof setupSchema>;

export async function createStudio(
  input: CreatorSetupInput,
): Promise<{ ok: false; error: string } | never> {
  const parsed = setupSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;
  const handle = data.handle.toLowerCase();

  // Category must belong to the chosen type (taxonomy is the source of truth),
  // and the issuance must clear the floors (100원/10개/5만원). Server-authoritative
  // so a client bypass can't create an invalid Studio.
  if (!isCategoryForType(data.creatorType, data.category)) {
    return { ok: false, error: "categoryRequired" };
  }
  const issuanceError = validateIssuance(data.mochiPriceKrw, data.mochiGoal);
  if (issuanceError) return { ok: false, error: issuanceError };

  const user = await getCurrentBacker();
  if (!user) return { ok: false, error: "generic" };

  // Already a creator? Just go to the Studio.
  const existing = await prisma.streamer.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (existing) redirect("/studio");

  // Server-side image gate: anything malformed becomes null rather than an
  // error, the same treatment `thumbnailKey` gets. A bad crop must not cost
  // someone their Studio at the last step of setup.
  const avatarUrl = data.avatarUrl
    ? parseImageDataUrl(data.avatarUrl, AVATAR_SPEC)
    : null;

  try {
    await prisma.$transaction(async (tx) => {
      const streamer = await tx.streamer.create({
        data: {
          handle,
          displayName: data.displayName,
          avatarUrl,
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
          grantedQuantity: 0,
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

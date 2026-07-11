"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const onboardSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
  displayName: z.string().min(1).max(60),
  handle: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9_]+$/),
  category: z.enum(["game", "music", "virtual", "daily", "study"]),
  creatorType: z.string().max(60).optional().default(""),
  gender: z.enum(["female", "male", "other", "undisclosed"]),
  age: z.coerce.number().int().positive(),
  bio: z.string().max(500).optional().default(""),
  // Money is integer KRW — coerce + validate as a positive integer.
  mochiPriceKrw: z.coerce.number().int().positive(),
  mochiGoal: z.coerce.number().int().positive(),
});

export type OnboardInput = z.input<typeof onboardSchema>;

/**
 * Create a creator account: a Backer (role=streamer), its Streamer profile, and
 * an initial MochiIssuance — then sign the new creator in. `signIn` throws a
 * NEXT_REDIRECT on success (propagated), so this only ever *returns* on failure.
 */
export async function onboardCreator(
  input: OnboardInput,
): Promise<{ ok: false; error: string } | never> {
  const parsed = onboardSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const handle = data.handle;
  const password = data.password;

  try {
    // Uniqueness is enforced by the DB (Backer.email, Streamer.handle). We rely
    // on the constraint rather than a pre-check so two concurrent signups can't
    // both pass a read and then collide — the whole transaction rolls back on a
    // duplicate, so no orphan account is left behind.
    await prisma.$transaction(async (tx) => {
      const account = await tx.backer.create({
        data: {
          email,
          nickname: data.displayName,
          passwordHash: hashPassword(password),
          role: "streamer",
          ageVerified: true,
          // Creators complete their own onboarding here, so they never hit the
          // fan /onboarding flow.
          onboardedAt: new Date(),
          termsAgreedAt: new Date(),
        },
      });

      const streamer = await tx.streamer.create({
        data: {
          handle,
          displayName: data.displayName,
          bio: data.bio,
          category: data.category,
          creatorType: data.creatorType,
          gender: data.gender,
          age: data.age,
          status: "approved",
          subMerchantId: `sub_${handle}`,
          ownerId: account.id,
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
    // Map a unique-constraint violation to the specific field that collided.
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      const target = e.meta?.target;
      const fields = Array.isArray(target)
        ? target.map(String)
        : typeof target === "string"
          ? [target]
          : [];
      if (fields.some((f) => f.includes("email")))
        return { ok: false, error: "emailTaken" };
      if (fields.some((f) => f.includes("handle")))
        return { ok: false, error: "handleTaken" };
    }
    return { ok: false, error: "generic" };
  }

  // Sign the new creator in. `signIn` throws NEXT_REDIRECT on success — let it
  // propagate; only AuthError (bad creds) is swallowed here.
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/creator/dashboard",
    });
  } catch (e) {
    if (!(e instanceof AuthError)) throw e; // rethrow the NEXT_REDIRECT signal
  }

  return { ok: false, error: "generic" };
}

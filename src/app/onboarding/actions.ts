"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { getVerificationProvider } from "@/lib/verification";
import { unstable_update } from "@/auth";

const HANDLE_RE = /^[a-z0-9_]{2,20}$/;

/** Live availability check for a fan @handle (format + uniqueness). */
export async function checkHandle(
  handle: string,
): Promise<{ available: boolean; reason?: "invalid" | "taken" }> {
  const h = handle.trim().toLowerCase();
  if (!HANDLE_RE.test(h)) return { available: false, reason: "invalid" };
  const backer = await getCurrentBacker();
  const existing = await prisma.backer.findUnique({
    where: { handle: h },
    select: { id: true },
  });
  if (existing && existing.id !== backer?.id) {
    return { available: false, reason: "taken" };
  }
  return { available: true };
}

/**
 * Run identity verification (본인인증) via the active provider and persist the
 * result server-side (the client is never trusted for verified data). Mock
 * returns a simulated adult identity; a real adapter does the carrier/PASS flow.
 */
export async function verifyIdentity(): Promise<{
  ok: boolean;
  isAdult?: boolean;
  birthYear?: number;
}> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false };
  try {
    const id = await getVerificationProvider().verify(backer.id);
    await prisma.backer.update({
      where: { id: backer.id },
      data: {
        verifiedAt: new Date(),
        verifiedName: id.name,
        birthYear: id.birthYear,
        gender: id.gender,
        ageVerified: id.isAdult,
        guardianConsent: id.isAdult ? null : false,
      },
    });
    return { ok: true, isAdult: id.isAdult, birthYear: id.birthYear };
  } catch {
    return { ok: false };
  }
}

const completeSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(HANDLE_RE),
  marketingConsent: z.boolean(),
  agreedTerms: z.boolean(),
});

export type CompleteOnboardingInput = z.input<typeof completeSchema>;

/**
 * Finalize onboarding: requires a server-verified identity + terms agreement.
 * Persists nickname/handle/consent + onboardedAt, refreshes the JWT (so the
 * middleware stops redirecting), and returns the user to the home page.
 */
export async function completeOnboarding(
  input: CompleteOnboardingInput,
): Promise<{ ok: false; error: string } | never> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;
  if (!data.agreedTerms) return { ok: false, error: "termsRequired" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "generic" };
  if (!backer.verifiedAt) return { ok: false, error: "verifyRequired" };

  try {
    await prisma.backer.update({
      where: { id: backer.id },
      data: {
        nickname: data.nickname,
        handle: data.handle,
        marketingConsent: data.marketingConsent,
        termsAgreedAt: new Date(),
        onboardedAt: new Date(),
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false, error: "handleRequired" }; // handle collided
    }
    return { ok: false, error: "generic" };
  }

  // Flip the onboarded flag in the JWT so middleware stops forcing /onboarding.
  await unstable_update({});
  redirect("/");
}

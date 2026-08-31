"use server";

import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";

/**
 * Record the answer to the one-time marketing re-ask.
 *
 * `marketingPromptedAt` is set **either way**. That is the whole safeguard: a
 * declined consent is re-asked at most once, and the column is what stops it
 * becoming a nag. Consent itself is only written when they said yes — a "no"
 * leaves `marketingConsent` exactly as it was rather than re-writing false, so
 * the original onboarding answer stays the record.
 */
export async function answerMarketingNudge({
  consent,
}: {
  consent: boolean;
}): Promise<{ ok: boolean }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false };

  await prisma.backer.update({
    where: { id: backer.id },
    data: {
      marketingPromptedAt: new Date(),
      ...(consent ? { marketingConsent: true } : {}),
    },
  });
  return { ok: true };
}

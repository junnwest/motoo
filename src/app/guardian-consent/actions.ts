"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { reportError, reportWarning } from "@/lib/report";

/**
 * Records a 법정대리인 동의 (docs/PRELAUNCH.md #31).
 *
 * The gate has existed in the money path since the eligibility work —
 * `assertCanPurchase` refuses a verified minor whose `guardianConsent` isn't
 * `true` — but nothing ever set it, so the branch was unreachable and every
 * minor was permanently stopped. This is the missing half.
 *
 * What it is not: verification. Confirming the guardian is who they say needs
 * their own 본인인증, which needs 사업자등록. So this records a declaration with
 * enough detail to evidence it, and the page states plainly that it will be
 * re-confirmed — an unverified consent presented as verified would be worse
 * than the gap it closes.
 */
const schema = z.object({
  guardianName: z.string().trim().min(2).max(40),
  relation: z.enum(["parent", "grandparent", "sibling", "other"]),
  // Phone or email — whichever the guardian actually answers. Not parsed into
  // a format, because a rejected-but-real contact helps nobody.
  contact: z.string().trim().min(5).max(120),
  agreed: z.literal(true),
});

export async function recordGuardianConsentAction(
  input: z.infer<typeof schema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("account", `guardian:${backer.id}`))) {
    return { ok: false, error: "tooMany" };
  }

  const me = await prisma.backer.findUnique({
    where: { id: backer.id },
    select: { verifiedAt: true, ageVerified: true, guardianConsent: true },
  });
  if (!me) return { ok: false, error: "generic" };

  // Age comes from 본인인증, never from the form. Without that, the page would
  // be a way for anyone to assert they are a minor — or for a minor to skip
  // straight past the check by claiming to be an adult.
  if (!me.verifiedAt) return { ok: false, error: "verifyFirst" };
  if (me.ageVerified) return { ok: false, error: "notMinor" };
  if (me.guardianConsent === true) return { ok: false, error: "already" };

  try {
    await prisma.backer.update({
      where: { id: backer.id },
      data: {
        guardianConsent: true,
        guardianConsentAt: new Date(),
        guardianName: parsed.data.guardianName,
        guardianRelation: parsed.data.relation,
        guardianContact: parsed.data.contact,
      },
    });
  } catch (e) {
    reportError(e, { scope: "guardianConsent.writeFailed" });
    return { ok: false, error: "generic" };
  }

  // Consent unlocks payments by a minor, so it is worth a line in the log on
  // its own — no personal data in it, just that it happened and to whom.
  reportWarning(new Error("guardian consent recorded"), {
    scope: "guardianConsent.recorded",
    meta: { backerId: backer.id, relation: parsed.data.relation },
  });

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Withdrawal. 개인정보보호법 requires withdrawing consent to be no harder than
 * giving it, and the same principle is why marketing consent is a checkbox in
 * /settings. Clearing it re-blocks the money path immediately and drops the
 * guardian's details, which are only kept as evidence of a consent that no
 * longer exists.
 */
export async function withdrawGuardianConsentAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };

  await prisma.backer.update({
    where: { id: backer.id },
    data: {
      guardianConsent: false,
      guardianConsentAt: null,
      guardianName: null,
      guardianRelation: null,
      guardianContact: null,
    },
  });

  revalidatePath("/settings");
  return { ok: true };
}

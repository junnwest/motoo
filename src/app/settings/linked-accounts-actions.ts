"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBacker } from "@/lib/session";
import { checkRateLimit } from "@/lib/rateLimit";
import { unlinkAccount } from "@/lib/linkedAccounts";

/**
 * Removing a linked provider. Linking itself has no server action — it's a
 * real navigation through /api/settings/link/<provider>, since it ends in an
 * external redirect (see that route for why).
 *
 * Thin wrapper: the session read and rate limit live here; the actual
 * lockout/delete logic is `src/lib/linkedAccounts.ts`'s `unlinkAccount`,
 * which takes an explicit backerId so it's testable without a request scope.
 */
export type LinkedAccountActionResult = { ok: true } | { ok: false; error: string };

export async function unlinkAccountAction(
  linkedAccountId: string,
): Promise<LinkedAccountActionResult> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "login" };
  if (!(await checkRateLimit("unlinkAccount", backer.id))) {
    return { ok: false, error: "tooMany" };
  }

  const result = await unlinkAccount(backer.id, linkedAccountId);
  if (!result.ok) {
    return { ok: false, error: result.error === "notFound" ? "generic" : result.error };
  }

  revalidatePath("/settings");
  return { ok: true };
}

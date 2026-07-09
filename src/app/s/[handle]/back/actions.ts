"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentBacker } from "@/lib/session";
import { getStreamerForBacking } from "@/lib/streamers";
import { createBacking, purchaseCookies } from "@/lib/backing";

const backSchema = z.object({
  handle: z.string(),
  tierId: z.string(),
  display: z.enum(["public", "nickname", "anonymous"]),
  displayName: z.string().max(40).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  ageVerified: z.boolean(),
  disclosureAgreed: z.boolean(),
});

export type BackActionResult =
  | { ok: true; foundingNumber: number; newBalance: number }
  | { ok: false; error: string };

export async function backAction(
  input: z.infer<typeof backSchema>,
): Promise<BackActionResult> {
  const parsed = backSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "generic" };
  const data = parsed.data;

  if (!data.ageVerified) return { ok: false, error: "ageRequired" };
  if (!data.disclosureAgreed) return { ok: false, error: "disclosureRequired" };

  const backer = await getCurrentBacker();
  if (!backer) return { ok: false, error: "generic" };
  if (!backer.ageVerified) return { ok: false, error: "ageRequired" };

  const streamer = await getStreamerForBacking(data.handle);
  if (!streamer) return { ok: false, error: "generic" };
  const tier = streamer.tiers.find((t) => t.id === data.tierId);
  if (!tier) return { ok: false, error: "tierRequired" };

  try {
    const res = await createBacking({
      backerId: backer.id,
      streamerId: streamer.id,
      tierId: tier.id,
      display: data.display,
      displayName: data.display === "nickname" ? data.displayName : null,
      message: data.message,
    });
    revalidatePath(`/s/${data.handle}`);
    return {
      ok: true,
      foundingNumber: res.foundingNumber,
      newBalance: res.newBalance,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "INSUFFICIENT_MOCHI")
      return { ok: false, error: "insufficientMochi" };
    return { ok: false, error: "generic" };
  }
}

export async function topUpAction(
  packId: string,
): Promise<{ ok: boolean; newBalance?: number }> {
  const backer = await getCurrentBacker();
  if (!backer) return { ok: false };
  try {
    const { newBalance } = await purchaseCookies(backer.id, packId);
    return { ok: true, newBalance };
  } catch {
    return { ok: false };
  }
}

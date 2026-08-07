import { NextResponse } from "next/server";
import { purgeExpiredAccounts } from "@/lib/accountDeletion";
import { pruneRateLimits } from "@/lib/rateLimit";

/**
 * Runs the account purge. Scheduled by `vercel.json`'s cron entry.
 *
 * **Nothing in this stack ran scheduled work before this**, so the grace period
 * needed a runner as much as it needed a policy — a deletion that is only ever
 * "scheduled" and never executed is not a deletion.
 *
 * `force-dynamic` because a cron route that gets statically optimised silently
 * stops doing anything.
 */
export const dynamic = "force-dynamic";

/**
 * Vercel signs cron invocations with `CRON_SECRET` in the Authorization header.
 * Without this check the endpoint is a public "delete expired accounts" button
 * — harmless in intent, but it lets anyone force the timing of an irreversible
 * job. Refuses to run at all when the secret is unset rather than defaulting
 * open: an unconfigured deploy should do nothing, not everything.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await purgeExpiredAccounts();
  // Piggy-backed on the same run: closed rate-limit windows are dead rows and
  // nothing else would ever remove them.
  const prunedRateLimits = await pruneRateLimits();
  console.log("[cron] purge-accounts", { ...result, prunedRateLimits });
  return NextResponse.json({ ok: true, ...result, prunedRateLimits });
}

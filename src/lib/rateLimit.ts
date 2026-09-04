import { prisma } from "@/lib/db";

/**
 * Rate limiting for the actions where repetition is the attack.
 *
 * Nothing was throttled before: `buyMochiAction`, `redeemItemAction`,
 * `toggleFollow`, the handle-availability check and every auth action could be
 * called as fast as a script could issue them. That compounds with the money
 * ceilings (a cap per purchase is not a cap per minute) and leaves the
 * credentials provider open to stuffing.
 *
 * **Postgres, not Redis.** The audit suggested Upstash, which is the
 * conventional answer, but it means a new hosted dependency and a new secret
 * for a product doing single-digit requests per second. A counter table in the
 * database that's already on the request path costs one upsert and no new
 * infrastructure. Swap the internals for a real bucket store when traffic
 * justifies it — every caller goes through `checkRateLimit`, so nothing else
 * has to change.
 *
 * Fails **open**: if the limiter itself errors, the action proceeds. A limiter
 * outage should not take payments down, and the guards it backstops (ownership
 * checks, purchase ceilings, balance guards) are all still in force.
 */

export type RateLimitRule = {
  /** Requests allowed inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
};

export const RATE_LIMITS = {
  /** Money leaving an account. Generous for a human, useless for a script. */
  buy: { limit: 10, windowSec: 60 },
  redeem: { limit: 20, windowSec: 60 },
  /** Credential stuffing is the thing being slowed here. */
  login: { limit: 10, windowSec: 300 },
  signup: { limit: 5, windowSec: 3600 },
  // Password reset: keyed on the submitted email. Tight, because each request
  // sends mail to an address the requester does not have to own.
  passwordReset: { limit: 3, windowSec: 3600 },
  /** Cheap but unbounded writes. */
  follow: { limit: 60, windowSec: 60 },
  /** Deleting an account, and the export that dumps everything about one. */
  account: { limit: 5, windowSec: 3600 },
  /** Starting a link redirect, and removing a linked provider. */
  linkAccount: { limit: 10, windowSec: 3600 },
  unlinkAccount: { limit: 10, windowSec: 3600 },
} as const satisfies Record<string, RateLimitRule>;

export type RateLimitKind = keyof typeof RATE_LIMITS;

/**
 * Consume one unit against `kind` for `subject` (a backer id, or an email/IP
 * for pre-auth actions). Returns false when the caller is over the limit.
 */
export async function checkRateLimit(
  kind: RateLimitKind,
  subject: string,
): Promise<boolean> {
  const rule = RATE_LIMITS[kind];
  const now = new Date();
  const windowStart = new Date(
    Math.floor(now.getTime() / (rule.windowSec * 1000)) * rule.windowSec * 1000,
  );
  const key = `${kind}:${subject}`;

  try {
    // Fixed window, claimed atomically: the upsert either creates the row for
    // this window or increments it, and the returned count is authoritative
    // even under concurrent calls.
    const row = await prisma.rateLimit.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    return row.count <= rule.limit;
  } catch (err) {
    console.error("checkRateLimit failed (allowing through)", kind, err);
    return true;
  }
}

/**
 * Delete counters for windows that have already closed. Called by the same
 * nightly cron as the account purge — without it this table grows forever.
 */
export async function pruneRateLimits(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return count;
}

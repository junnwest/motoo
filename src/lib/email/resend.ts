import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";
import { EMAIL_FROM } from "./index";
import { SUPPORT_EMAIL } from "@/lib/support";

/**
 * Resend adapter (docs/PRELAUNCH.md #2's remaining half).
 *
 * Needed by more than convenience now: donating requires a confirmed address
 * (`assertCanPurchase`), so with the mock provider in production the
 * verification mail is printed to a server log and nobody can ever satisfy the
 * gate. A gate that cannot be passed is not a gate, it is an outage.
 *
 * Plain `fetch` against Resend's HTTP API rather than their SDK: it is one POST,
 * the SDK is a dependency that would need auditing and updating, and this runs
 * in a Next server context that already has fetch.
 *
 * **Never throws**, per the `EmailProvider` contract — a failed send returns
 * `{ ok: false }` and the caller decides. That contract is why a password reset
 * or a signup cannot be taken down by an email outage.
 */
/**
 * How long one send may take before it is abandoned.
 *
 * The contract above says a failed send must not take down the request that
 * triggered it — but `catch` only covers a request that *fails*, not one that
 * hangs, and `sendVerificationEmail` is awaited inline inside `signupUser`.
 * Without a deadline, a slow provider stalls a signup until the platform's own
 * timeout kills it, and the account is created with no response ever returned.
 * Ten seconds is far beyond Resend's normal sub-second reply; anything past it
 * is an outage, and an outage should degrade to "unverified address" rather
 * than to a broken signup.
 */
const SEND_TIMEOUT_MS = 10_000;

export class ResendEmailProvider implements EmailProvider {
  private readonly apiKey: string;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      // Thrown at construction, which happens on the first send rather than at
      // boot. Loud on purpose: EMAIL_PROVIDER=resend with no key means every
      // password reset silently fails, and silence is the failure mode worth
      // refusing.
      throw new Error("EMAIL_PROVIDER=resend but RESEND_API_KEY is unset.");
    }
    this.apiKey = key;
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [input.to],
          subject: input.subject,
          text: input.text,
          // Transactional mail goes out as no-reply, but people reply to it
          // anyway — a verification mail is often the first thing a confused
          // user answers. Pointing replies at the published support address
          // costs nothing and is better than a bounce.
          ...(SUPPORT_EMAIL ? { reply_to: SUPPORT_EMAIL } : {}),
          ...(input.html ? { html: input.html } : {}),
        }),
      });

      if (!res.ok) {
        // The body carries Resend's own reason (unverified domain, bad key,
        // rate limit). Kept, because "email failed" without it is unactionable
        // — and truncated, because it ends up in a log.
        const detail = (await res.text()).slice(0, 200);
        return { ok: false, error: `resend ${res.status}: ${detail}` };
      }

      const body = (await res.json()) as { id?: string };
      return { ok: true, id: body.id ?? "resend_unknown" };
    } catch (e) {
      // Network-level failure. Still not a throw: see the class header.
      return {
        ok: false,
        error: e instanceof Error ? e.message : "resend request failed",
      };
    }
  }
}

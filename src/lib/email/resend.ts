import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";
import { EMAIL_FROM } from "./index";

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
        headers: {
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [input.to],
          subject: input.subject,
          text: input.text,
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

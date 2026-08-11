/**
 * Email delivery, behind the same provider abstraction as `PaymentProvider` and
 * `VerificationProvider` — the codebase's established shape for "a real vendor
 * is needed eventually, a mock is honest until then".
 *
 * The product had **no email channel at all** until 2026-08-11, which is what
 * made a forgotten password a permanent lockout (see docs/PRELAUNCH.md #1-#2).
 * Unlike the PG and 본인인증, nothing here is blocked by 사업자등록: a domain and
 * a provider account are enough, so the mock is a stopgap of days, not months.
 */

export type EmailAddress = string;

export type SendEmailInput = {
  to: EmailAddress;
  subject: string;
  /** Plain text. Required — some clients never render the HTML part, and a
   *  password reset that arrives blank is worse than one that arrives ugly. */
  text: string;
  html?: string;
};

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export interface EmailProvider {
  /**
   * Deliver one message. Implementations must not throw for ordinary delivery
   * failures — callers decide whether a failure is fatal, and for most of them
   * it isn't (a verification mail can be re-requested; a password reset must
   * never take down the request that triggered it).
   */
  send(input: SendEmailInput): Promise<SendEmailResult>;
}

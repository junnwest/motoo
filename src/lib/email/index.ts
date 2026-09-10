import type { EmailProvider } from "./types";
import { MockEmailProvider } from "./mock";
import { ResendEmailProvider } from "./resend";

export * from "./types";

let provider: EmailProvider | null = null;

/**
 * Resolve the active email provider from env. "mock" prints; "resend" delivers
 * and needs a verified sending domain (themotoo.com) plus an API key — neither
 * of which needs 사업자등록.
 *
 * Same shape as `getPaymentProvider` / `getVerificationProvider`, including the
 * throw on an unknown value: a typo in EMAIL_PROVIDER should fail loudly at the
 * first send, not silently fall back to logging password-reset links to stdout
 * in production.
 */
export function getEmailProvider(): EmailProvider {
  if (provider) return provider;

  const kind = process.env.EMAIL_PROVIDER ?? "mock";
  switch (kind) {
    case "mock":
      provider = new MockEmailProvider();
      break;
    case "resend":
      provider = new ResendEmailProvider();
      break;
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${kind}". Implemented: "mock", "resend".`,
      );
  }
  return provider;
}

/** Where transactional mail claims to come from. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "motoo <no-reply@themotoo.com>";

/**
 * Whether mail actually reaches a person, rather than a server log.
 *
 * The mock provider is honest in dev and a trap in production: `/forgot`
 * deliberately reports success for every address — anything else turns it into
 * an account-existence oracle — so with no real provider a locked-out user is
 * told a link is on the way and waits for it forever, with no other route
 * offered.
 *
 * This is the one thing about that situation which is safe to say out loud:
 * it's a property of the deployment, identical for every visitor, so surfacing
 * it leaks nothing about who has an account. Callers use it to offer the
 * support channel instead of a promise they cannot keep.
 */
export function isEmailDeliveryEnabled(): boolean {
  return (process.env.EMAIL_PROVIDER ?? "mock") !== "mock";
}

import type { EmailProvider } from "./types";
import { MockEmailProvider } from "./mock";

export * from "./types";

let provider: EmailProvider | null = null;

/**
 * Resolve the active email provider from env. Only "mock" is implemented;
 * "resend" / "ses" are the intended adapters and need a verified sending domain
 * (themotoo.com) plus an API key — neither of which needs 사업자등록.
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
    // case "resend": provider = new ResendEmailProvider(); break;
    // case "ses": provider = new SesEmailProvider(); break;
    default:
      throw new Error(
        `Unknown EMAIL_PROVIDER "${kind}". Only "mock" is implemented so far.`,
      );
  }
  return provider;
}

/** Where transactional mail claims to come from. */
export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "motoo <no-reply@themotoo.com>";

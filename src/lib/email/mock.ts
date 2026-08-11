import type { EmailProvider, SendEmailInput, SendEmailResult } from "./types";

/**
 * Dev email: logs the message and succeeds.
 *
 * It prints the **whole body**, deliberately. A password-reset link that only
 * exists inside an email nobody can read makes the flow untestable in dev, and
 * the alternative people reach for — printing the raw token from the action —
 * bypasses the exact code path that needs testing. Same reasoning as
 * `VERIFICATION_MOCK_MINOR`: the mock exists so the real rule stays reachable.
 *
 * Never selected in production: `getEmailProvider` throws on an unknown
 * provider, and prod is expected to set EMAIL_PROVIDER explicitly.
 */
export class MockEmailProvider implements EmailProvider {
  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const id = `mock_${Math.random().toString(36).slice(2, 10)}`;
    console.info(
      [
        "",
        "──────── email (mock) ────────",
        `to:      ${input.to}`,
        `subject: ${input.subject}`,
        "",
        input.text,
        "──────────────────────────────",
        "",
      ].join("\n"),
    );
    return { ok: true, id };
  }
}

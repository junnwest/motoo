import type { VerificationProvider } from "./types";
import { MockVerificationProvider } from "./mock";

export * from "./types";

let provider: VerificationProvider | null = null;

/**
 * Resolve the active identity-verification provider from env. Only "mock" is
 * implemented in v1; "nice" / "pass" are documented adapter stubs that require a
 * 본인확인기관 contract + a redirect/callback flow.
 */
export function getVerificationProvider(): VerificationProvider {
  if (provider) return provider;

  const kind = process.env.VERIFICATION_PROVIDER ?? "mock";
  switch (kind) {
    case "mock":
      provider = new MockVerificationProvider();
      break;
    // case "nice": provider = new NiceVerificationProvider(); break;
    // case "pass": provider = new PassVerificationProvider(); break;
    default:
      throw new Error(
        `Unknown VERIFICATION_PROVIDER "${kind}". Only "mock" is implemented in v1.`,
      );
  }
  return provider;
}

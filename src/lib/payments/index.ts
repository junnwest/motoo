import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock";

export * from "./types";

let provider: PaymentProvider | null = null;

/**
 * Resolve the active PaymentProvider from env. Only "mock" is implemented in v1;
 * "toss" / "nice" are documented adapter stubs for production sub-merchant flows.
 */
export function getPaymentProvider(): PaymentProvider {
  if (provider) return provider;

  const kind = process.env.PAYMENT_PROVIDER ?? "mock";
  switch (kind) {
    case "mock":
      provider = new MockPaymentProvider();
      break;
    // case "toss": provider = new TossPaymentProvider(); break;
    // case "nice": provider = new NicePaymentProvider(); break;
    default:
      throw new Error(
        `Unknown PAYMENT_PROVIDER "${kind}". Only "mock" is implemented in v1.`,
      );
  }
  return provider;
}

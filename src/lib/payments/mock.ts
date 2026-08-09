import type {
  DonationRequest,
  DonationResult,
  PaymentProvider,
  PurchaseRequest,
  PurchaseResult,
  SettlementRequest,
  SettlementResult,
  VoidChargeRequest,
  VoidChargeResult,
} from "./types";

/**
 * Development PaymentProvider. Simulates a licensed Korean PG without any real
 * charge. Deterministic transaction ids are derived from the idempotency key so
 * retries don't double-count. Swap for a real Toss/NICE adapter in production.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";

  async purchaseCookies(req: PurchaseRequest): Promise<PurchaseResult> {
    // Simulate a tiny network delay so optimistic UI paths are exercised.
    await delay(120);
    return {
      ok: true,
      transactionId: `mock_tx_${req.idempotencyKey}`,
      mochiGranted: req.pack.mochi,
      receiptId: `mock_receipt_${req.idempotencyKey}`,
    };
  }

  async donate(req: DonationRequest): Promise<DonationResult> {
    await delay(120);
    return {
      ok: true,
      transactionId: `mock_tx_${req.idempotencyKey}`,
      receiptId: `mock_receipt_${req.idempotencyKey}`,
    };
  }

  async voidCharge(req: VoidChargeRequest): Promise<VoidChargeResult> {
    await delay(60);
    // No real funds move in the mock; a real adapter would refund/void the PG charge.
    void req;
    return { ok: true };
  }

  async settleToStreamer(req: SettlementRequest): Promise<SettlementResult> {
    await delay(80);
    return {
      ok: true,
      settlementId: `mock_settle_${req.backingRef}`,
    };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

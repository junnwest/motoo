/**
 * PaymentProvider abstraction. motoo is a Korean-market product: Stripe does not
 * apply. Funds route through a licensed Korean PG directly to streamer
 * sub-merchant accounts — motoo never holds backer funds (spec §8).
 *
 * The virtual-currency ("모찌"/cookies) model: backers buy fixed packs, then spend
 * mochi to back a streamer. This follows the 별풍선 (prepaid consumable) pattern.
 */

export interface CookiePack {
  id: string;
  /** mochi units granted */
  mochi: number;
  /** price in integer KRW */
  priceKrw: number;
  /** optional bonus mochi shown as a perk of larger packs */
  bonus?: number;
}

export interface PurchaseRequest {
  backerId: string;
  pack: CookiePack;
  /** idempotency key so a retried request never double-charges */
  idempotencyKey: string;
}

/**
 * Phase 2: buy a creator's mochi. Unlike fixed cookie packs, the buyer chooses a
 * quantity and the price is the creator's per-mochi rate (MochiIssuance). The PG
 * charges `amountKrw` to the buyer; mochi is credited to a per-creator holding.
 */
export interface MochiPurchaseRequest {
  backerId: string;
  streamerId: string;
  /** mochi units being bought */
  quantity: number;
  /** integer KRW total charged to the buyer (quantity × pricePerMochiKrw) */
  amountKrw: number;
  /** idempotency key so a retried request never double-charges */
  idempotencyKey: string;
}

export interface PurchaseResult {
  ok: boolean;
  transactionId: string;
  mochiGranted: number;
  /** cash receipt (현금영수증) reference where applicable */
  receiptId?: string;
  error?: string;
}

/**
 * A backing settlement: mochi is converted to KRW and routed to the streamer's
 * sub-merchant account. motoo is the intermediary of record, not a fund holder.
 */
export interface SettlementRequest {
  streamerSubMerchantId: string;
  amountKrw: number;
  backingRef: string;
}

export interface SettlementResult {
  ok: boolean;
  settlementId: string;
  error?: string;
}

/**
 * Compensating void/refund of a mochi purchase charge, keyed by the same
 * idempotencyKey used to charge. Used when the DB failed to credit mochi after
 * a successful charge — the buyer must not be left charged with nothing.
 */
export interface VoidChargeRequest {
  idempotencyKey: string;
  amountKrw: number;
}

export interface VoidChargeResult {
  ok: boolean;
  error?: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Buy a cookie pack (real PG charge in production; simulated in mock). */
  purchaseCookies(req: PurchaseRequest): Promise<PurchaseResult>;
  /** Phase 2: buy a creator's mochi at their per-mochi rate (real PG charge; mock simulates). */
  purchaseMochi(req: MochiPurchaseRequest): Promise<PurchaseResult>;
  /** Compensating void/refund of a mochi charge when crediting mochi fails afterward. */
  voidCharge(req: VoidChargeRequest): Promise<VoidChargeResult>;
  /** Route a backing's/purchase's KRW to the streamer sub-merchant. */
  settleToStreamer(req: SettlementRequest): Promise<SettlementResult>;
}

/** Fixed cookie packs. 1 mochi = ₩100 (spec leaves the rate to us). */
export const COOKIE_PACKS: CookiePack[] = [
  { id: "pack_10", mochi: 10, priceKrw: 1000 },
  { id: "pack_30", mochi: 30, priceKrw: 3000 },
  { id: "pack_50", mochi: 55, priceKrw: 5000, bonus: 5 },
  { id: "pack_100", mochi: 115, priceKrw: 10000, bonus: 15 },
  { id: "pack_300", mochi: 360, priceKrw: 30000, bonus: 60 },
];

export const MOCHI_TO_KRW = 100;

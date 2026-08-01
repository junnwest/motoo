/**
 * Mochi issuance presets + floor validation — shared by the creator setup form
 * and the Studio issuance editor so identical rules apply everywhere. Money is
 * integer KRW, never floats. Mochi is prepaid marketplace credit, NOT a
 * financial product — no return/yield vocabulary here.
 */

// Floors (enforced on both client and server).
export const MOCHI_MIN_PRICE = 100; // 원 per mochi
export const MOCHI_MIN_COUNT = 10; // mochi issued
export const MOCHI_MIN_TOTAL = 50_000; // 원, total face value (price × count)

// Standard presets: "issue N원 worth at 100원 each". Price is fixed at the
// minimum; the count is derived (totalKrw / price).
export const MOCHI_PRESET_PRICE = 100;
export const MOCHI_PRESETS = [
  { key: "s", totalKrw: 100_000 }, // 1,000 mochi
  { key: "m", totalKrw: 500_000 }, // 5,000 mochi
  { key: "l", totalKrw: 1_000_000 }, // 10,000 mochi
] as const;
export type MochiPresetKey = (typeof MOCHI_PRESETS)[number]["key"];

/**
 * The preset we recommend to a creator opening their Studio: 50만원 (5,000 mochi
 * at 100원). Big enough that a market of a few items is actually reachable,
 * small enough that it isn't an intimidating obligation on day one — issuance is
 * a fulfillment duty, not a fundraising target (DECISIONS 2026-07-14). Picked by
 * default in the issuance picker and badged as 추천.
 */
export const MOCHI_RECOMMENDED_PRESET: MochiPresetKey = "m";

/** Convert a preset's total into a (price, count) issuance pair. */
export function presetToIssuance(totalKrw: number): {
  pricePerMochiKrw: number;
  goalQuantity: number;
} {
  return {
    pricePerMochiKrw: MOCHI_PRESET_PRICE,
    goalQuantity: Math.round(totalKrw / MOCHI_PRESET_PRICE),
  };
}

export type IssuanceError = "priceMin" | "countMin" | "totalMin";

/**
 * Return the first violated floor, or null if the issuance is valid.
 * Integer KRW only — a non-integer price or count fails as below-minimum.
 */
export function validateIssuance(
  pricePerMochiKrw: number,
  goalQuantity: number,
): IssuanceError | null {
  if (!Number.isInteger(pricePerMochiKrw) || pricePerMochiKrw < MOCHI_MIN_PRICE)
    return "priceMin";
  if (!Number.isInteger(goalQuantity) || goalQuantity < MOCHI_MIN_COUNT)
    return "countMin";
  if (pricePerMochiKrw * goalQuantity < MOCHI_MIN_TOTAL) return "totalMin";
  return null;
}

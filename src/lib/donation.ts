/**
 * Fan-facing donation quick-pick amounts, shown on the donate page. Distinct
 * from MOCHI_PRESETS in issuance.ts — those are the CREATOR's Studio-side
 * lifetime bonus-goal totals, set once; these are a per-donation amount a fan
 * taps when donating to a creator.
 */
export const DONATION_PRESET_AMOUNTS_KRW = [1_000, 5_000, 10_000, 30_000] as const;

export const DONATION_RECOMMENDED_AMOUNT_KRW: (typeof DONATION_PRESET_AMOUNTS_KRW)[number] = 5_000;

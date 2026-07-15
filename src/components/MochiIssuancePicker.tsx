"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  MOCHI_MIN_PRICE,
  MOCHI_MIN_COUNT,
  MOCHI_PRESET_PRICE,
  MOCHI_PRESETS,
  presetToIssuance,
  validateIssuance,
} from "@/lib/issuance";

export type IssuanceSelection = {
  price: number;
  count: number;
  /** i18n key under mochiIssuance.errors, or null when valid. */
  error: string | null;
  /** true when the chosen price exceeds the current tier price (a raise). */
  raised: boolean;
};

type Mode = "s" | "m" | "l" | "custom";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60";

/**
 * Shared mochi issuance picker — standard presets (issue N원 at 100원 each) or a
 * custom price + count, with the issuance floors and the ratchet rule enforced.
 *
 * Used at creator onboarding (fresh setup) and in the Studio editor (ongoing
 * edits). Pass `currentPrice` in the Studio: the price can then only ratchet up,
 * a raise shows the discard warning, and — because presets are fixed at 100원 —
 * presets hide once the current price has moved above 100 (edit via custom).
 */
export function MochiIssuancePicker({
  minPrice = MOCHI_MIN_PRICE,
  currentPrice = null,
  defaultMode,
  defaultPrice,
  defaultCount,
  onChange,
}: {
  minPrice?: number;
  currentPrice?: number | null;
  defaultMode?: Mode;
  defaultPrice?: string;
  defaultCount?: string;
  onChange: (v: IssuanceSelection) => void;
}) {
  const t = useTranslations("mochiIssuance");

  // Presets fix the price at 100원; they only apply while the floor is still 100.
  const presetsUsable = MOCHI_PRESET_PRICE >= minPrice;

  const [mode, setMode] = useState<Mode>(
    defaultMode ?? (presetsUsable ? "s" : "custom"),
  );
  const [customPrice, setCustomPrice] = useState(
    defaultPrice ?? String(minPrice),
  );
  const [customCount, setCustomCount] = useState(defaultCount ?? "");

  const { price, count } = useMemo(() => {
    if (mode === "custom" || !presetsUsable) {
      return {
        price: Math.trunc(Number(customPrice) || 0),
        count: Math.trunc(Number(customCount) || 0),
      };
    }
    const preset = MOCHI_PRESETS.find((p) => p.key === mode)!;
    const iss = presetToIssuance(preset.totalKrw);
    return { price: iss.pricePerMochiKrw, count: iss.goalQuantity };
  }, [mode, customPrice, customCount, presetsUsable]);

  const total = price * count;
  // Floors first, then the ratchet (only in Studio, where currentPrice is set).
  const floorError = validateIssuance(price, count);
  const belowMin = price < minPrice;
  const error =
    floorError ??
    (belowMin ? (currentPrice !== null ? "priceOnlyUp" : "priceMin") : null);
  const raised = currentPrice !== null && price > currentPrice;

  useEffect(() => {
    onChange({ price, count, error, raised });
  }, [price, count, error, raised, onChange]);

  const showCustomInputs = mode === "custom" || !presetsUsable;

  return (
    <div>
      {presetsUsable ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOCHI_PRESETS.map((p) => {
            const iss = presetToIssuance(p.totalKrw);
            const selected = mode === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setMode(p.key)}
                aria-pressed={selected}
                className={`flex flex-col items-start rounded-[14px] border px-4 py-3 text-left transition ${
                  selected
                    ? "border-coral bg-coral-chip"
                    : "border-line-3 bg-white hover:border-coral/50"
                }`}
              >
                <span className="text-[15px] font-extrabold text-ink">
                  {t(`presets.${p.key}`)}
                </span>
                <span className="mt-0.5 text-[11.5px] leading-tight text-muted">
                  {t("presetSub", {
                    count: iss.goalQuantity,
                    price: iss.pricePerMochiKrw,
                  })}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setMode("custom")}
            aria-pressed={mode === "custom"}
            className={`flex flex-col items-start justify-center rounded-[14px] border px-4 py-3 text-left transition ${
              mode === "custom"
                ? "border-coral bg-coral-chip"
                : "border-line-3 bg-white hover:border-coral/50"
            }`}
          >
            <span className="text-[15px] font-extrabold text-ink">
              {t("presets.custom")}
            </span>
          </button>
        </div>
      ) : (
        <p className="text-[13px] text-muted">{t("presetsUnavailable")}</p>
      )}

      {showCustomInputs ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="mip-price" className={labelClass}>
              {t("customPrice")}
            </label>
            <input
              id="mip-price"
              type="number"
              min={minPrice}
              step={1}
              inputMode="numeric"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="mip-count" className={labelClass}>
              {t("customCount")}
            </label>
            <input
              id="mip-count"
              type="number"
              min={MOCHI_MIN_COUNT}
              step={1}
              inputMode="numeric"
              value={customCount}
              onChange={(e) => setCustomCount(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ) : null}

      <p className="mt-3 text-[13px] text-muted">
        {currentPrice !== null ? t("priceOnlyUpHint") : t("floorHint")}
      </p>

      {raised ? (
        <p className="mt-2 rounded-[10px] bg-coral-chip px-3 py-2 text-[13px] font-medium text-coral-deep">
          {t("raiseWarning")}
        </p>
      ) : null}

      <div className="mt-2 rounded-[16px] bg-panel px-4 py-3 text-[14px] font-semibold text-ink">
        {t("summary", { goal: count, price, total })}
      </div>

      {error ? (
        <p className="mt-2 text-[13px] font-medium text-live">
          {t(`errors.${error}`)}
        </p>
      ) : null}
    </div>
  );
}

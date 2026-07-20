"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  MochiIssuancePicker,
  type IssuanceSelection,
} from "@/components/MochiIssuancePicker";
import { MOCHI_MIN_PRICE } from "@/lib/issuance";
import { updateIssuance } from "./actions";

type Issuance = {
  pricePerMochiKrw: number;
  goalQuantity: number;
  soldQuantity: number;
  active: boolean;
} | null;

const FLOOR_KEYS = ["priceMin", "countMin", "totalMin", "priceOnlyUp"];

/**
 * Studio issuance editor. Uses the same MochiIssuancePicker as creator onboarding
 * (preloaded with the current price + availability), so setup and editing share
 * one interface. The picker enforces the ratchet: price only goes up, a raise
 * shows the discard warning, and presets hide once the price is above 100원.
 */
export function MochiSettingsForm({ issuance }: { issuance: Issuance }) {
  const t = useTranslations("creatorDashboard");
  const tm = useTranslations("mochiIssuance");
  const [isPending, startTransition] = useTransition();

  const [active, setActive] = useState(issuance?.active ?? false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = issuance?.pricePerMochiKrw ?? null;
  const [mochi, setMochi] = useState<IssuanceSelection | null>(null);
  const onMochiChange = useCallback((v: IssuanceSelection) => setMochi(v), []);

  const blocked = !mochi || !!mochi.error;
  const errorText =
    error && FLOOR_KEYS.includes(error) ? tm(`errors.${error}`) : t("saveError");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    if (!mochi || mochi.error) return setError(mochi?.error ?? "countMin");
    startTransition(async () => {
      const res = await updateIssuance({
        pricePerMochiKrw: mochi.price,
        goalQuantity: mochi.count,
        active,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-0 flex-1 flex-col justify-center rounded-[20px] border border-line-2 bg-card p-6"
    >
      <div className="flex flex-col gap-5">
        <MochiIssuancePicker
          minPrice={currentPrice ?? MOCHI_MIN_PRICE}
          currentPrice={currentPrice}
          defaultMode={issuance ? "custom" : undefined}
          defaultPrice={issuance ? String(issuance.pricePerMochiKrw) : undefined}
          defaultCount={issuance ? String(issuance.goalQuantity) : undefined}
          onChange={onMochiChange}
        />

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 shrink-0 rounded-[6px] border border-line-3 accent-coral"
          />
          <span className="text-[15px] font-semibold text-ink">
            {t("mochi.active")}
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={isPending || blocked}>
            {t("mochi.save")}
          </Button>
          {saved ? (
            <span className="rounded-full bg-sage-bg px-3 py-1.5 text-[13px] font-semibold text-sage">
              {t("mochi.saved")}
            </span>
          ) : null}
          {error ? (
            <span className="text-[13px] font-semibold text-live">
              {errorText}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

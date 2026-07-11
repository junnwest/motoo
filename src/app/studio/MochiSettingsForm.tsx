"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { updateIssuance } from "./actions";

type Issuance = {
  pricePerMochiKrw: number;
  goalQuantity: number;
  soldQuantity: number;
  active: boolean;
} | null;

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60";

export function MochiSettingsForm({ issuance }: { issuance: Issuance }) {
  const t = useTranslations("creatorDashboard");
  const [isPending, startTransition] = useTransition();

  const [price, setPrice] = useState(String(issuance?.pricePerMochiKrw ?? 200));
  const [goal, setGoal] = useState(String(issuance?.goalQuantity ?? 100));
  const [active, setActive] = useState(issuance?.active ?? false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(false);
    startTransition(async () => {
      const res = await updateIssuance({
        pricePerMochiKrw: Math.trunc(Number(price)),
        goalQuantity: Math.trunc(Number(goal)),
        active,
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(true);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-[520px] rounded-[20px] border border-line-2 bg-card p-6"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="mochi-price" className={labelClass}>
            {t("mochi.price")}
          </label>
          <input
            id="mochi-price"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="mochi-goal" className={labelClass}>
            {t("mochi.goal")}
          </label>
          <input
            id="mochi-goal"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className={inputClass}
          />
          {issuance ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[13px] text-muted">
              <Mochi width={16} height={12} />
              {t("mochi.sold", { count: issuance.soldQuantity })}
            </p>
          ) : null}
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-[6px] border border-line-3 accent-coral"
          />
          <span>
            <span className="block text-[15px] font-semibold text-ink">
              {t("mochi.active")}
            </span>
            <span className="mt-0.5 block text-[13px] text-muted">
              {active ? t("mochi.activeOn") : t("mochi.activeOff")}
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={isPending}>
            {t("mochi.save")}
          </Button>
          {saved ? (
            <span className="rounded-full bg-sage-bg px-3 py-1.5 text-[13px] font-semibold text-sage">
              {t("mochi.saved")}
            </span>
          ) : null}
          {error ? (
            <span className="text-[13px] font-semibold text-live">
              {t("saveError")}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

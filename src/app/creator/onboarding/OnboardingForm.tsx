"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { createStudio } from "./actions";

const CATEGORIES = ["game", "music", "virtual", "daily", "study"] as const;

const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";

/**
 * Creator setup — the add-on that turns a signed-in user into a creator by
 * opening their Studio. Collects only creator-specific info (public profile +
 * mochi issuance); account + identity were done at user signup/onboarding.
 */
export function CreatorSetupForm({ defaultName }: { defaultName: string }) {
  const t = useTranslations("creatorOnboarding");
  const tcat = useTranslations("fanLanding.categories");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(defaultName);
  const [handle, setHandle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("game");
  const [creatorType, setCreatorType] = useState("");
  const [bio, setBio] = useState("");
  const [mochiPriceKrw, setMochiPriceKrw] = useState("");
  const [mochiGoal, setMochiGoal] = useState("");

  const price = Number(mochiPriceKrw) || 0;
  const goal = Number(mochiGoal) || 0;
  const total = price * goal;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // createStudio throws NEXT_REDIRECT on success; it only returns on failure.
      const res = await createStudio({
        displayName,
        handle,
        category,
        creatorType,
        bio,
        mochiPriceKrw,
        mochiGoal,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      {/* 크리에이터 프로필 */}
      <section className="rounded-[20px] border border-line-2 bg-card p-6 sm:p-7">
        <Eyebrow className="mb-4">{t("sectionProfile")}</Eyebrow>
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="displayName" className={labelClass}>
              {t("displayName")}
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("displayNamePlaceholder")}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="handle" className={labelClass}>
              {t("handle")}
            </label>
            <input
              id="handle"
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder={t("handlePlaceholder")}
              required
              className={inputClass}
            />
            <p className="mt-1.5 text-[13px] text-muted">{t("handleHint")}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelClass}>
                {t("category")}
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as (typeof CATEGORIES)[number])
                }
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {tcat(c)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="creatorType" className={labelClass}>
                {t("creatorType")}
              </label>
              <input
                id="creatorType"
                type="text"
                value={creatorType}
                onChange={(e) => setCreatorType(e.target.value)}
                placeholder={t("creatorTypePlaceholder")}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className={labelClass}>
              {t("bio")}
            </label>
            <textarea
              id="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bioPlaceholder")}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </section>

      {/* 모찌 발행 */}
      <section className="rounded-[20px] border border-line-2 bg-card p-6 sm:p-7">
        <Eyebrow className="mb-4">{t("sectionMochi")}</Eyebrow>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mochiPriceKrw" className={labelClass}>
                {t("mochiPrice")}
              </label>
              <input
                id="mochiPriceKrw"
                type="number"
                min={1}
                inputMode="numeric"
                value={mochiPriceKrw}
                onChange={(e) => setMochiPriceKrw(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="mochiGoal" className={labelClass}>
                {t("mochiGoal")}
              </label>
              <input
                id="mochiGoal"
                type="number"
                min={1}
                inputMode="numeric"
                value={mochiGoal}
                onChange={(e) => setMochiGoal(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <p className="text-[13px] text-muted">{t("mochiGoalHint")}</p>

          <div className="rounded-[16px] bg-panel px-4 py-3 text-[14px] font-semibold text-ink">
            {t("goalSummary", { goal, price, total })}
          </div>
        </div>
      </section>

      {error && (
        <p className="text-[14px] font-medium text-live">
          {t(`errors.${error}`)}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

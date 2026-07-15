"use client";

import { useCallback, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import {
  MochiIssuancePicker,
  type IssuanceSelection,
} from "@/components/MochiIssuancePicker";
import {
  CREATOR_TYPES,
  CATEGORIES_BY_TYPE,
  type CreatorType,
} from "@/lib/creatorTaxonomy";
import { MOCHI_MIN_PRICE } from "@/lib/issuance";
import { createStudio } from "./actions";

const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60";
const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";

/**
 * Creator setup — the add-on that turns a signed-in user into a creator by
 * opening their Studio. Collects creator TYPE (primary) → CATEGORY (dependent
 * sub-facet) + mochi issuance (shared MochiIssuancePicker: presets or custom,
 * floored at 100원/10개/5만원). Account + identity were done at user signup.
 */
export function CreatorSetupForm({
  defaultName,
  defaultHandle,
}: {
  defaultName: string;
  defaultHandle: string;
}) {
  const t = useTranslations("creatorOnboarding");
  const tax = useTranslations("creatorTaxonomy");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(defaultName);
  // Prefill the Studio address with the account @handle (already chosen +
  // unique at onboarding). Still editable: the Streamer handle is a separate
  // namespace, so it can differ or collide.
  const [handle, setHandle] = useState(defaultHandle);
  const [creatorType, setCreatorType] = useState<CreatorType | "">("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");

  // Mochi issuance is owned by the shared picker; it reports the resolved
  // (price, count) + validity here. Starts invalid until the picker mounts.
  const [mochi, setMochi] = useState<IssuanceSelection>({
    price: 0,
    count: 0,
    error: "countMin",
    raised: false,
  });
  const onMochiChange = useCallback((v: IssuanceSelection) => setMochi(v), []);

  const categoryOptions = creatorType ? CATEGORIES_BY_TYPE[creatorType] : [];

  const canSubmit =
    !!displayName.trim() &&
    !!handle.trim() &&
    !!creatorType &&
    !!category &&
    !mochi.error &&
    !pending;

  function onTypeChange(next: string) {
    setCreatorType(next as CreatorType);
    setCategory(""); // reset dependent category when the type changes
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!creatorType) return setError("typeRequired");
    if (!category) return setError("categoryRequired");
    if (mochi.error) return setError(mochi.error);
    startTransition(async () => {
      // createStudio throws NEXT_REDIRECT on success; it only returns on failure.
      const res = await createStudio({
        displayName,
        handle,
        category,
        creatorType,
        bio,
        mochiPriceKrw: String(mochi.price),
        mochiGoal: String(mochi.count),
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

          {/* 유형(주) → 카테고리(종속) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="creatorType" className={labelClass}>
                {t("creatorType")}
              </label>
              <select
                id="creatorType"
                value={creatorType}
                onChange={(e) => onTypeChange(e.target.value)}
                required
                className={inputClass}
              >
                <option value="" disabled>
                  {t("typePlaceholder")}
                </option>
                {CREATOR_TYPES.map((ty) => (
                  <option key={ty} value={ty}>
                    {tax(`types.${ty}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="category" className={labelClass}>
                {t("category")}
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                disabled={!creatorType}
                className={`${inputClass} disabled:bg-panel disabled:text-muted`}
              >
                <option value="" disabled>
                  {creatorType
                    ? t("categoryPlaceholder")
                    : t("categoryTypeFirst")}
                </option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {tax(`categories.${c}`)}
                  </option>
                ))}
              </select>
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
        <Eyebrow className="mb-2">{t("sectionMochi")}</Eyebrow>
        <p className="mb-4 text-[13px] text-muted">{t("sectionMochiHint")}</p>
        <MochiIssuancePicker minPrice={MOCHI_MIN_PRICE} onChange={onMochiChange} />
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
        disabled={!canSubmit}
        className="w-full"
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

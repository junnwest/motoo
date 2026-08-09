"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Mochi } from "@/components/Mochi";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { IconHeart } from "@/components/ui/Icons";
import { formatKrw, formatCount } from "@/lib/format";
import {
  DONATION_PRESET_AMOUNTS_KRW,
  DONATION_RECOMMENDED_AMOUNT_KRW,
} from "@/lib/donation";
import { donateMochiAction } from "@/app/s/[handle]/marketplace-actions";
// Reads live in @/lib/follows; the mutation is the only server action, and it
// lives here so the reads can stay cached (stage 6, DECISIONS 2026-08-08).
import { toggleFollow } from "@/lib/follow-actions";
import { MOCHI_MAX_PURCHASE_KRW } from "@/lib/issuance";

type Issuance = {
  pricePerMochiKrw: number;
  goalQuantity: number;
  grantedQuantity: number;
  active: boolean;
};

/**
 * User-side donate module, imported into the creator profile page. A fan
 * donates KRW directly to a creator (100% of it reaches them — motoo takes
 * 0% cut); mochi is never sold, it's granted afterward as a bonus at the
 * creator's current rate (a soft goal, only ever raised — see
 * docs/DECISIONS.md, the donation-pivot entry).
 */
export function DonateMochi({
  handle,
  streamerId,
  creatorName,
  issuance,
  balance,
  loggedIn,
  following,
}: {
  handle: string;
  streamerId: string;
  creatorName: string;
  issuance: Issuance | null;
  balance: number;
  loggedIn: boolean;
  /** Already following this creator? Gates the post-donation follow nudge —
   * omit/false for a logged-out visitor, who can't follow yet anyway. */
  following?: boolean;
}) {
  const t = useTranslations("donate");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState<number>(DONATION_RECOMMENDED_AMOUNT_KRW);
  const [customMode, setCustomMode] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // First donation is the moment "do you want to hear from them" is most
  // relevant — donating does NOT auto-follow (DECISIONS 2026-07-30: the two
  // stay independent), so this nudges instead.
  const [nowFollowing, setNowFollowing] = useState(!!following);
  const [followPending, startFollowTransition] = useTransition();

  function onFollowClick() {
    startFollowTransition(async () => {
      const res = await toggleFollow(streamerId, handle);
      if (res.ok) {
        setNowFollowing(res.following);
        router.refresh(); // syncs the header FollowButton's server-rendered prop
      }
    });
  }

  const open = issuance !== null && issuance.active;

  const price = issuance?.pricePerMochiKrw ?? 0;
  const belowMin = price > 0 && amount < price;
  const bonusPreview = price > 0 ? Math.floor(amount / price) : 0;
  // The most this fan may donate in one go. Mirrors `validatePurchase` on the
  // server, which is what actually enforces it; this only keeps the UI from
  // offering an amount that would bounce.
  const atMax = amount >= MOCHI_MAX_PURCHASE_KRW;
  const percent =
    issuance && issuance.goalQuantity > 0
      ? Math.min(
          100,
          Math.round((issuance.grantedQuantity / issuance.goalQuantity) * 100),
        )
      : 0;

  function submit() {
    if (!issuance || belowMin) return;
    setError(null);
    setSuccess(null);
    // One idempotency token per user-initiated donation; a retry of this same
    // click reuses it so the PG never double-charges.
    const idempotencyKey = crypto.randomUUID();
    startTransition(async () => {
      const res = await donateMochiAction({
        handle,
        streamerId,
        donationAmountKrw: amount,
        idempotencyKey,
      });
      if (res.ok) {
        setSuccess(res.mochiGranted);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-[20px] border border-line-2 bg-card p-6">
      <Eyebrow>{t("title")}</Eyebrow>
      <p className="mt-1.5 text-[15px] text-body">
        {t("subtitle", { name: creatorName })}
      </p>

      {!open || !issuance ? (
        <p className="mt-5 text-[15px] text-muted">{t("notOnSale")}</p>
      ) : (
        <div className="mt-5">
          {/* current holding balance */}
          <div className="flex items-center justify-between rounded-[14px] bg-panel px-4 py-3">
            <span className="text-[13px] font-semibold text-muted-2">
              {t("myBalance")}
            </span>
            <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
              <Mochi width={16} height={12} />
              {formatCount(balance)}
            </span>
          </div>

          <p className="mt-4 text-[14px] text-muted">
            {t("mochiRate", { price })}
          </p>

          {/* Donation amount: preset grid, then a custom field. A <span>, not a
              <label>: the presets are buttons and the custom field only appears
              once 직접 입력 is chosen, so there's no single control this could
              point `htmlFor` at — and a label with no target is worse than
              none. The field carries the same text as its aria-label. */}
          <span className="mb-1.5 mt-4 block text-[13px] font-semibold text-muted-2">
            {t("amountLabel")}
          </span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {DONATION_PRESET_AMOUNTS_KRW.map((v) => (
              <Button
                key={v}
                type="button"
                variant={!customMode && amount === v ? "primary" : "secondary"}
                aria-pressed={!customMode && amount === v}
                disabled={pending}
                onClick={() => {
                  setCustomMode(false);
                  setAmount(v);
                }}
              >
                {formatKrw(v)}
              </Button>
            ))}
            <Button
              type="button"
              variant={customMode ? "primary" : "secondary"}
              aria-pressed={customMode}
              disabled={pending}
              onClick={() => setCustomMode(true)}
            >
              {t("customAmount")}
            </Button>
          </div>
          {customMode && (
            <Input
              type="number"
              min={1}
              max={MOCHI_MAX_PURCHASE_KRW}
              value={amount}
              disabled={pending}
              aria-label={t("amountLabel")}
              onChange={(e) => {
                const n = Math.trunc(Number(e.target.value));
                // Clamp on the way in — typing past the cap silently snaps back
                // to it rather than letting the donate button submit a doomed
                // value.
                setAmount(
                  Number.isFinite(n) && n >= 1
                    ? Math.min(n, MOCHI_MAX_PURCHASE_KRW)
                    : 1,
                );
              }}
              fieldClassName="mt-2 w-full"
              className="text-center"
            />
          )}
          {atMax && (
            // The raw number, not a compact form — a limit has to be exact, and
            // "100만" is both imprecise and awkward next to a typed figure. ICU
            // formats the number arg with locale grouping.
            <p className="mt-1.5 text-[12px] text-muted">
              {t("amountMaxHint", { max: MOCHI_MAX_PURCHASE_KRW })}
            </p>
          )}

          {/* derived bonus preview */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[14px] text-muted-2">
              {belowMin ? "" : t("bonusPreview", { count: bonusPreview })}
            </span>
          </div>
          {belowMin && (
            <p className="mt-1 text-[13px] font-semibold text-live">
              {t("belowMinHint", { price })}
            </p>
          )}

          {/* soft-goal progress */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full bg-line-4">
              <div
                className="h-full rounded-full bg-coral transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-1.5 text-[12px] text-muted">
              {t("goalProgress", { percent })}
            </p>
          </div>

          {/* submit */}
          <div className="mt-5">
            {loggedIn ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                loading={pending}
                disabled={belowMin}
                onClick={submit}
              >
                {pending ? t("submitting") : t("submitButton", { amount })}
              </Button>
            ) : (
              <ButtonLink
                href="/login"
                variant="primary"
                size="lg"
                className="w-full"
              >
                {t("submitButton", { amount })}
              </ButtonLink>
            )}
          </div>

          {success !== null && (
            <div className="mt-3 rounded-[12px] bg-sage-bg px-4 py-3">
              <p className="text-[14px] font-semibold text-sage">
                {t("success", { count: success })}
              </p>
              {!nowFollowing && (
                <button
                  type="button"
                  onClick={onFollowClick}
                  disabled={followPending}
                  className="mt-2.5 flex items-center gap-1.5 rounded-[10px] bg-white px-3 py-2 text-[13px] font-bold text-ink transition-colors hover:text-coral-deep disabled:opacity-60"
                >
                  <IconHeart width={14} height={14} />
                  {t("followNudge", { name: creatorName })}
                </button>
              )}
            </div>
          )}
          {error && (
            <InlineMessage tone="error" className="mt-3">
              {t(`errors.${error}`)}
            </InlineMessage>
          )}

          {/* non-financial disclosure — the refund terms it summarises live at /refund */}
          <p className="mt-5 text-[12px] leading-[1.6] text-muted">
            {t("disclosure")}{" "}
            <Link href="/refund" className="underline hover:text-body">
              {t("disclosureLink")}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}

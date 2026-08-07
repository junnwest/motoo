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
import { buyMochiAction } from "@/app/s/[handle]/marketplace-actions";
import { toggleFollow } from "@/lib/follow-actions";
import {
  MOCHI_MAX_PURCHASE_QTY,
  MOCHI_MAX_PURCHASE_KRW,
} from "@/lib/issuance";

type Issuance = {
  pricePerMochiKrw: number;
  goalQuantity: number;
  soldQuantity: number;
  active: boolean;
};

/**
 * User-side buy-mochi module, imported into the creator profile page.
 * A creator issues their own mochi at a per-mochi KRW rate (a soft goal); the
 * user buys mochi into a per-creator holding to spend in the creator's market.
 */
export function BuyMochi({
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
  /** Already following this creator? Gates the post-purchase follow nudge —
   * omit/false for a logged-out visitor, who can't follow yet anyway. */
  following?: boolean;
}) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(10);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // First purchase is the moment "do you want to hear from them" is most
  // relevant — buying does NOT auto-follow (DECISIONS 2026-07-30: the two
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

  const onSale = issuance !== null && issuance.active;

  const price = issuance?.pricePerMochiKrw ?? 0;

  /**
   * The most this fan may buy in one go: the unit ceiling, and whatever the KRW
   * ceiling works out to at this creator's price — whichever binds first. Mirrors
   * `validatePurchase` on the server, which is what actually enforces it; this
   * only keeps the UI from offering a quantity that would bounce.
   */
  const maxQuantity = Math.max(
    1,
    Math.min(
      MOCHI_MAX_PURCHASE_QTY,
      price > 0 ? Math.floor(MOCHI_MAX_PURCHASE_KRW / price) : MOCHI_MAX_PURCHASE_QTY,
    ),
  );
  const atMax = quantity >= maxQuantity;

  const total = quantity * price;
  const percent =
    issuance && issuance.goalQuantity > 0
      ? Math.min(
          100,
          Math.round((issuance.soldQuantity / issuance.goalQuantity) * 100),
        )
      : 0;

  function submit() {
    if (!issuance) return;
    setError(null);
    setSuccess(null);
    const qty = quantity;
    // One idempotency token per user-initiated purchase; a retry of this same
    // click reuses it so the PG never double-charges.
    const idempotencyKey = crypto.randomUUID();
    startTransition(async () => {
      const res = await buyMochiAction({
        handle,
        streamerId,
        quantity: qty,
        idempotencyKey,
      });
      if (res.ok) {
        setSuccess(qty);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="rounded-[20px] border border-line-2 bg-card p-6">
      <Eyebrow>{t("buyTitle")}</Eyebrow>
      <p className="mt-1.5 text-[15px] text-body">
        {t("buySubtitle", { name: creatorName })}
      </p>

      {!onSale || !issuance ? (
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
            {t("pricePerMochi", { price })}
          </p>

          {/* Quantity stepper. A <span>, not a <label>: the group is − / field /
              +, so there's no single control this could point `htmlFor` at, and
              a label with no target is worse than none. The field carries the
              same text as its aria-label. */}
          <span className="mb-1.5 mt-4 block text-[13px] font-semibold text-muted-2">
            {t("quantityLabel")}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              aria-label="-"
              className="!px-4"
              disabled={pending || quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              −
            </Button>
            <Input
              type="number"
              min={1}
              max={maxQuantity}
              value={quantity}
              disabled={pending}
              aria-label={t("quantityLabel")}
              onChange={(e) => {
                const n = Math.trunc(Number(e.target.value));
                // Clamp on the way in — typing past the cap silently snaps back
                // to it rather than letting the buy button submit a doomed value.
                setQuantity(
                  Number.isFinite(n) && n >= 1 ? Math.min(n, maxQuantity) : 1,
                );
              }}
              // The stepper's − / + sit either side, so the field itself is the
              // flex child that grows; the label above is rendered separately.
              fieldClassName="w-full"
              className="text-center"
            />
            <Button
              type="button"
              variant="secondary"
              aria-label="+"
              className="!px-4"
              disabled={pending || atMax}
              onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            >
              +
            </Button>
          </div>
          {atMax && (
            // The raw number, not formatCount() — a limit has to be exact, and
            // its compact form ("5.0k") is both imprecise and Latin-glyphed in
            // Korean copy. ICU formats the number arg with locale grouping.
            <p className="mt-1.5 text-[12px] text-muted">
              {t("quantityMaxHint", { max: maxQuantity })}
            </p>
          )}

          {/* you pay */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[14px] text-muted-2">{t("youPay")}</span>
            <span className="text-[18px] font-extrabold tracking-[-0.02em] text-ink">
              {formatKrw(total)}
            </span>
          </div>

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

          {/* buy button */}
          <div className="mt-5">
            {loggedIn ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full"
                loading={pending}
                onClick={submit}
              >
                {pending ? t("buying") : t("buyButton", { amount: total })}
              </Button>
            ) : (
              <ButtonLink
                href="/login"
                variant="primary"
                size="lg"
                className="w-full"
              >
                {t("buyButton", { amount: total })}
              </ButtonLink>
            )}
          </div>

          {success !== null && (
            <div className="mt-3 rounded-[12px] bg-sage-bg px-4 py-3">
              <p className="text-[14px] font-semibold text-sage">
                {t("bought", { count: success })}
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

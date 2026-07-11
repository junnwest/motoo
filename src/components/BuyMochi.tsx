"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Mochi } from "@/components/Mochi";
import { formatKrw, formatCount } from "@/lib/format";
import { buyMochiAction } from "@/app/s/[handle]/marketplace-actions";

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
}: {
  handle: string;
  streamerId: string;
  creatorName: string;
  issuance: Issuance | null;
  balance: number;
  loggedIn: boolean;
}) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(10);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSale = issuance !== null && issuance.active;

  const price = issuance?.pricePerMochiKrw ?? 0;
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

          {/* quantity stepper */}
          <label className="mb-1.5 mt-4 block text-[13px] font-semibold text-muted-2">
            {t("quantityLabel")}
          </label>
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
            <input
              type="number"
              min={1}
              value={quantity}
              disabled={pending}
              onChange={(e) => {
                const n = Math.trunc(Number(e.target.value));
                setQuantity(Number.isFinite(n) && n >= 1 ? n : 1);
              }}
              className="w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-center text-[15px] outline-none focus:border-coral/60"
            />
            <Button
              type="button"
              variant="secondary"
              aria-label="+"
              className="!px-4"
              disabled={pending}
              onClick={() => setQuantity((q) => q + 1)}
            >
              +
            </Button>
          </div>

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
                disabled={pending}
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
            <p className="mt-3 rounded-[12px] bg-sage-bg px-4 py-3 text-[14px] font-semibold text-sage">
              {t("bought", { count: success })}
            </p>
          )}
          {error && (
            <p className="mt-3 text-[14px] font-semibold text-live">
              {t(`errors.${error}`)}
            </p>
          )}

          {/* non-financial disclosure */}
          <p className="mt-5 text-[12px] leading-[1.6] text-muted">
            {t("disclosure")}
          </p>
        </div>
      )}
    </div>
  );
}

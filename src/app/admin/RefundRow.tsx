"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { resolveRefundAction } from "@/app/refund/request-actions";

/**
 * One open refund request.
 *
 * Three outcomes, not two. "승인" records that motoo agrees the refund is owed;
 * "환불 완료" records that the money actually went back. They are separate
 * because with `PAYMENT_PROVIDER=mock` there is no way to move money at all, so
 * collapsing them would make every approval a lie about a payment. Once a real
 * PG lands, approved-but-not-refunded is exactly the worklist to reconcile.
 */
export function RefundRow({
  requestId,
  creatorName,
  backerLabel,
  amountKrw,
  mochiGranted,
  donatedAt,
  reason,
  detail,
  eligibleAtRequest,
  status,
}: {
  requestId: string;
  creatorName: string;
  backerLabel: string;
  amountKrw: number;
  mochiGranted: number;
  donatedAt: string;
  reason: string;
  detail: string | null;
  eligibleAtRequest: boolean;
  status: "open" | "approved";
}) {
  const t = useTranslations("admin");
  const tr = useTranslations("refundRequest");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function resolve(next: "approved" | "rejected" | "refunded") {
    setError(null);
    start(async () => {
      const res = await resolveRefundAction({ requestId, status: next });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b border-line-2 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-bold text-ink">{creatorName}</span>
        <span className="text-sm font-extrabold text-ink">
          {t("refunds.amount", { amount: amountKrw })}
        </span>
        <span className="text-xs text-muted">
          {t("refunds.granted", { count: mochiGranted })} · {donatedAt}
        </span>
        {/* The verdict the fan was shown at submission time, not a fresh one —
            the window closes on its own, and re-deriving it here would answer a
            different question than the one they were answering. */}
        <span
          className={`rounded-full px-2 py-0.5 text-2xs font-semibold ${
            eligibleAtRequest
              ? "bg-sage-bg text-sage"
              : "bg-coral-chip text-coral-deep"
          }`}
        >
          {eligibleAtRequest
            ? t("refunds.eligible")
            : t("refunds.ineligible")}
        </span>
        {status === "approved" && (
          <span className="rounded-full bg-panel px-2 py-0.5 text-2xs font-semibold text-muted">
            {tr("status.approved")}
          </span>
        )}
      </div>

      <div className="text-sm text-body break-keep">
        {tr(`reasons.${reason}` as never)}
      </div>
      {detail && (
        <p className="text-sm text-muted break-keep whitespace-pre-wrap">
          {detail}
        </p>
      )}
      <div className="text-xs text-muted">{backerLabel}</div>

      {error && <InlineMessage tone="error">{t(`errors.${error}` as never)}</InlineMessage>}

      <div className="mt-1 flex flex-wrap gap-2">
        {status === "open" && (
          <>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="!px-3 !py-1.5 !text-xs"
              disabled={pending}
              onClick={() => resolve("approved")}
            >
              {t("refunds.approve")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="!px-3 !py-1.5 !text-xs"
              disabled={pending}
              onClick={() => resolve("rejected")}
            >
              {t("refunds.reject")}
            </Button>
          </>
        )}
        <Button
          type="button"
          variant="primary"
          size="md"
          className="!px-3 !py-1.5 !text-xs"
          disabled={pending}
          onClick={() => resolve("refunded")}
        >
          {t("refunds.markRefunded")}
        </Button>
      </div>
    </div>
  );
}

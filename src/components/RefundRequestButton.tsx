"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { requestRefundAction } from "@/app/refund/request-actions";

type Reason = "withdrawal" | "legal" | "other";

/**
 * Asks for a donation back.
 *
 * /refund has stated a real 7-day 청약철회 right since 2026-08-06 with no way to
 * exercise it — a published policy and an inbox that doesn't exist. This is the
 * inbox.
 *
 * The eligible/ineligible distinction is shown, not enforced: an ineligible
 * donation still gets a submit button, because the 법령 carve-out overrides the
 * window and a fan whose payment was a minor's has a claim the 7-day rule knows
 * nothing about. What the button changes is the framing — an eligible request
 * says the policy covers this, an ineligible one says it will be reviewed
 * individually and doesn't promise the outcome.
 */
export function RefundRequestButton({
  donationId,
  creatorName,
  amountKrw,
  eligible,
  ineligibleReason,
}: {
  donationId: string;
  creatorName: string;
  amountKrw: number;
  eligible: boolean;
  ineligibleReason?: "expired" | "spent" | "alreadyRequested" | null;
}) {
  const t = useTranslations("refundRequest");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>(
    eligible ? "withdrawal" : "other",
  );
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await requestRefundAction({ donationId, reason, detail });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="!px-3 !py-1.5 !text-xs"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {t("cta")}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        titleId={`refund-${donationId}`}
        closeLabel={tc("close")}
      >
        <h2
          id={`refund-${donationId}`}
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("subtitle", { creator: creatorName, amount: amountKrw })}
        </p>

        {/* The status line is the honest part: it tells the fan what the policy
            says about *this* donation before they spend time on the form. */}
        <div
          className={`mt-4 rounded-md px-4 py-3 text-sm leading-relaxed break-keep ${
            eligible
              ? "bg-sage-bg text-sage"
              : "bg-panel text-body"
          }`}
        >
          {eligible
            ? t("eligible")
            : t(`ineligible.${ineligibleReason ?? "expired"}` as never)}
        </div>

        <fieldset className="mt-5">
          <legend className="text-sm font-bold text-ink">
            {t("reasonLabel")}
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {(["withdrawal", "legal", "other"] as const).map((r) => (
              <label
                key={r}
                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line-2 px-3 py-2.5 text-sm text-body has-[:checked]:border-coral has-[:checked]:bg-coral-chip/40"
              >
                <input
                  type="radio"
                  name={`refund-reason-${donationId}`}
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="mt-0.5 accent-coral"
                />
                <span className="break-keep">{t(`reasons.${r}`)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink">{t("detailLabel")}</span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder={t("detailPlaceholder")}
            className="mt-1.5 w-full resize-y rounded-md border border-line-2 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </label>

        <p className="mt-3 text-xs leading-relaxed text-muted break-keep">
          {t.rich("policyNote", {
            link: (chunks) => (
              <Link href="/refund" className="underline hover:text-ink">
                {chunks}
              </Link>
            ),
          })}
        </p>

        {error && (
          <InlineMessage tone="error" className="mt-4">
            {t(`errors.${error}` as never)}
          </InlineMessage>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            variant="primary"
            loading={pending}
            onClick={submit}
            className="w-full"
          >
            {t("submit")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setOpen(false)}
            className="w-full"
          >
            {t("cancel")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

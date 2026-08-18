"use client";

import { useId, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { submitReportAction } from "@/app/report-actions";

const REASONS = [
  "impersonation",
  "scam",
  "sexual",
  "harassment",
  "other",
] as const;

/**
 * Report a creator or an item. Quiet by design — a small text link, not a
 * button competing with 후원하기: reporting is rare, and a loud control invites
 * mis-taps on a page whose main action involves money.
 *
 * Signed-out visitors get nothing rather than a login wall, matching how
 * FollowButton handles the same case.
 */
export function ReportButton({
  targetType,
  targetId,
  signedIn,
}: {
  targetType: "creator" | "item";
  targetId: string;
  signedIn: boolean;
}) {
  const t = useTranslations("report");
  const tc = useTranslations("common");
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>(
    "impersonation",
  );
  const [detail, setDetail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!signedIn) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted underline-offset-2 hover:text-live hover:underline"
      >
        {t("trigger")}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        titleId={titleId}
        closeLabel={tc("close")}
      >
        <h2 id={titleId} className="text-lg font-extrabold text-ink break-keep">
          {done ? t("thanksTitle") : t("title")}
        </h2>

        {done ? (
          <>
            <p className="mt-2 text-base leading-relaxed text-body break-keep">
              {t("thanksBody")}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-4"
              onClick={() => setOpen(false)}
            >
              {tc("close")}
            </Button>
          </>
        ) : (
          <form
            className="mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              start(async () => {
                const res = await submitReportAction({
                  targetType,
                  targetId,
                  reason,
                  detail,
                });
                if (res.ok) setDone(true);
                else setError(res.error);
              });
            }}
          >
            <fieldset>
              <legend className="text-xs font-semibold text-muted-2">
                {t("reasonLegend")}
              </legend>
              <div className="mt-2 flex flex-col gap-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className="flex items-center gap-2 text-sm text-ink"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      disabled={pending}
                      onChange={() => setReason(r)}
                      className="accent-coral"
                    />
                    {t(`reasons.${r}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            <Textarea
              label={t("detailLabel")}
              fieldClassName="mt-3"
              rows={3}
              value={detail}
              disabled={pending}
              maxLength={1000}
              onChange={(e) => setDetail(e.target.value)}
            />

            {error && (
              <InlineMessage tone="error" className="mt-3">
                {t(`errors.${error}`)}
              </InlineMessage>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="mt-4 w-full"
              loading={pending}
            >
              {pending ? t("submitting") : t("submit")}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}

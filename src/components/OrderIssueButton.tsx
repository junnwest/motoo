"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InlineMessage } from "@/components/ui/InlineMessage";
import {
  openOrderIssueAction,
  resolveOrderIssueAction,
} from "@/lib/orderIssues";

type Reason = "not_delivered" | "not_as_described" | "other";

export type IssueState = {
  id: string;
  status: "open" | "replied" | "resolved" | "escalated";
  creatorReply: string | null;
} | null;

/**
 * The fan's side of an order dispute (docs/PRELAUNCH.md #30).
 *
 * Three states in one control, because to the fan they are one thing — the
 * state of their complaint: raise it, read the reply and decide, or see that it
 * is closed. Splitting them across separate components would put the reply
 * somewhere other than where they left the question.
 *
 * Not offered on a cancelled order: the mochi is already back, so there is
 * nothing to dispute, and the action refuses it regardless of what renders.
 */
export function OrderIssueButton({
  orderId,
  itemTitle,
  issue,
}: {
  orderId: string;
  itemTitle: string;
  issue: IssueState;
}) {
  const t = useTranslations("orderIssue");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>("not_delivered");
  const [detail, setDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (issue?.status === "resolved") {
    return (
      <span className="rounded-full bg-panel px-2.5 py-1 text-2xs font-semibold text-muted">
        {t("status.resolved")}
      </span>
    );
  }

  if (issue) {
    return (
      <>
        <Button
          type="button"
          variant="ghost"
          size="md"
          className="!px-3 !py-1.5 !text-xs"
          onClick={() => setOpen(true)}
        >
          {t(`status.${issue.status}` as never)}
        </Button>

        <Modal
          open={open}
          onClose={() => setOpen(false)}
          titleId={`issue-${orderId}`}
          closeLabel={tc("close")}
        >
          <h2
            id={`issue-${orderId}`}
            className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
          >
            {itemTitle}
          </h2>

          {issue.creatorReply ? (
            <>
              <p className="mt-4 text-sm font-bold text-ink">
                {t("replyLabel")}
              </p>
              <p className="mt-1 whitespace-pre-wrap break-keep text-base leading-relaxed text-body">
                {issue.creatorReply}
              </p>
            </>
          ) : (
            <p className="mt-4 break-keep text-base leading-relaxed text-body">
              {t("waiting")}
            </p>
          )}

          {issue.status === "escalated" && (
            <p className="mt-4 break-keep border-l-2 border-line-2 pl-4 text-sm text-muted">
              {t("escalatedNote")}
            </p>
          )}

          {error && (
            <InlineMessage tone="error" className="mt-4">
              {t(`errors.${error}` as never)}
            </InlineMessage>
          )}

          {/* Both outcomes belong to the fan. A creator closing their own
              dispute is the move this whole path exists to prevent. */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              type="button"
              variant="primary"
              loading={pending}
              className="w-full"
              onClick={() =>
                start(async () => {
                  const res = await resolveOrderIssueAction({
                    issueId: issue.id,
                    outcome: "resolved",
                  });
                  if (res.ok) {
                    setOpen(false);
                    router.refresh();
                  } else setError(res.error);
                })
              }
            >
              {t("markResolved")}
            </Button>
            {issue.status !== "escalated" && (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                className="w-full"
                onClick={() =>
                  start(async () => {
                    const res = await resolveOrderIssueAction({
                      issueId: issue.id,
                      outcome: "escalated",
                    });
                    if (res.ok) {
                      setOpen(false);
                      router.refresh();
                    } else setError(res.error);
                  })
                }
              >
                {t("escalate")}
              </Button>
            )}
          </div>
        </Modal>
      </>
    );
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
        titleId={`issue-new-${orderId}`}
        closeLabel={tc("close")}
      >
        <h2
          id={`issue-new-${orderId}`}
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("title")}
        </h2>
        <p className="mt-2 break-keep text-base leading-relaxed text-body">
          {t("subtitle", { item: itemTitle })}
        </p>

        <fieldset className="mt-5">
          <legend className="text-sm font-bold text-ink">
            {t("reasonLabel")}
          </legend>
          <div className="mt-2 flex flex-col gap-2">
            {(["not_delivered", "not_as_described", "other"] as const).map(
              (r) => (
                <label
                  key={r}
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line-2 px-3 py-2.5 text-sm text-body has-[:checked]:border-coral has-[:checked]:bg-coral-chip/40"
                >
                  <input
                    type="radio"
                    name={`issue-reason-${orderId}`}
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="mt-0.5 accent-coral"
                  />
                  <span className="break-keep">{t(`reasons.${r}`)}</span>
                </label>
              ),
            )}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink">{t("detailLabel")}</span>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={3}
            minLength={5}
            maxLength={1000}
            placeholder={t("detailPlaceholder")}
            className="mt-1.5 w-full resize-y rounded-md border border-line-2 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </label>

        {/* Says where this goes before they write it. A complaint that silently
            reaches only the person being complained about would be a trap. */}
        <p className="mt-3 break-keep text-xs leading-relaxed text-muted">
          {t("note")}
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
            className="w-full"
            onClick={() =>
              start(async () => {
                const res = await openOrderIssueAction({
                  orderId,
                  reason,
                  detail,
                });
                if (res.ok) {
                  setOpen(false);
                  router.refresh();
                } else setError(res.error);
              })
            }
          >
            {t("submit")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="w-full"
            onClick={() => setOpen(false)}
          >
            {tc("close")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

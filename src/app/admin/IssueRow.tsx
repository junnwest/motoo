"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { closeEscalatedIssueAction } from "@/lib/orderIssues";

/**
 * One escalated order dispute (docs/PRELAUNCH.md #30).
 *
 * Only escalated ones reach here. An open dispute is between the fan and the
 * creator, and putting every one of them in front of motoo would turn a queue
 * that should stay short into a feed nobody reads — which is how the important
 * ones get missed.
 *
 * Closing records the admin's email in `resolvedBy`, the same audit shape
 * suspension and refunds use: "who decided this" must be answerable later.
 */
export function IssueRow({
  issueId,
  itemTitle,
  buyer,
  creatorName,
  reason,
  detail,
  creatorReply,
  mochiSpent,
  escalatedAt,
}: {
  issueId: string;
  itemTitle: string;
  buyer: string;
  creatorName: string;
  reason: string;
  detail: string;
  creatorReply: string | null;
  mochiSpent: number;
  escalatedAt: string;
}) {
  const t = useTranslations("admin.issues");
  const tr = useTranslations("orderIssue");
  const ta = useTranslations("admin");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-2 border-b border-line-2 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-sm font-bold text-ink">{itemTitle}</span>
        <span className="text-xs text-muted">
          {buyer} → {creatorName}
        </span>
        <span className="text-xs text-muted">
          {mochiSpent}모찌 · {escalatedAt}
        </span>
      </div>

      <div className="text-sm text-body break-keep">
        {tr(`reasons.${reason}` as never)}
      </div>
      <p className="whitespace-pre-wrap text-sm text-muted break-keep">
        {detail}
      </p>

      {/* Shown even when absent: "the creator never answered" is itself the
          most useful fact on the row. */}
      <p className="border-l-2 border-line-2 pl-3 text-sm text-muted break-keep">
        {creatorReply ? `${t("reply")}: ${creatorReply}` : t("noReply")}
      </p>

      {error && (
        <InlineMessage tone="error">{ta(`errors.${error}` as never)}</InlineMessage>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          placeholder={t("notePlaceholder")}
          className="min-w-[220px] flex-1 rounded-md border border-line-2 bg-card px-3 py-1.5 text-sm text-ink outline-none focus:border-coral"
        />
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="!px-3 !py-1.5 !text-xs"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await closeEscalatedIssueAction({ issueId, note });
              if (!res.ok) setError(res.error);
            })
          }
        >
          {t("close")}
        </Button>
      </div>
    </div>
  );
}

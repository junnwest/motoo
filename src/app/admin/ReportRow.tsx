"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { resolveReportAction } from "@/app/report-actions";
import {
  hideItemAction,
  unhideItemAction,
  hideUpdateAction,
  unhideUpdateAction,
} from "./actions";

/**
 * One open report, with the two outcomes that exist: it led to something, or it
 * didn't. Resolving is deliberately separate from suspending — this records a
 * judgement, the suspend control changes the world, and merging them would make
 * "dismissed" ambiguous about whether anything actually happened.
 */
export function ReportRow({
  reportId,
  targetType,
  targetId,
  targetLabel,
  targetHref,
  reason,
  detail,
  reporter,
  createdAt,
  targetHidden,
}: {
  reportId: string;
  targetType: "creator" | "item" | "update";
  /** The reported thing's own id — what a takedown acts on. */
  targetId: string;
  targetLabel: string;
  targetHref: string | null;
  reason: string;
  detail: string | null;
  reporter: string;
  createdAt: string;
  /** Whether the reported item/post is already taken down. */
  targetHidden?: boolean;
}) {
  const t = useTranslations("admin");
  const tr = useTranslations("report");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [takedownReason, setTakedownReason] = useState("");

  /**
   * The takedown, from the queue that surfaced the problem.
   *
   * `hideItemAction` shipped with the item-takedown work and had no caller at
   * all — the console could suspend a whole creator but not remove the one
   * listing a report was about, which is the sledgehammer that work existed to
   * replace. It is wired here rather than on the creator list because a report
   * is how an admin learns a specific thing is wrong, and it already carries
   * the id.
   */
  function takedown() {
    setError(null);
    start(async () => {
      const res =
        targetType === "item"
          ? await hideItemAction({ itemId: targetId, reason: takedownReason })
          : await hideUpdateAction({ updateId: targetId, reason: takedownReason });
      if (!res.ok) setError(res.error);
      else setTakedownReason("");
    });
  }

  function restore() {
    setError(null);
    start(async () => {
      const res =
        targetType === "item"
          ? await unhideItemAction({ itemId: targetId })
          : await unhideUpdateAction({ updateId: targetId });
      if (!res.ok) setError(res.error);
    });
  }

  function resolve(status: "actioned" | "dismissed") {
    setError(null);
    start(async () => {
      const res = await resolveReportAction({ reportId, status });
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-2 border-b border-line-2 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="rounded-full bg-coral-chip px-2.5 py-1 text-2xs font-semibold text-coral-deep">
          {t(`reportTarget.${targetType}`)}
        </span>
        {targetHref ? (
          <Link
            href={targetHref}
            className="text-base font-bold text-ink hover:text-coral-deep"
          >
            {targetLabel}
          </Link>
        ) : (
          <span className="text-base font-bold text-ink">{targetLabel}</span>
        )}
        <span className="text-sm font-semibold text-live">
          {tr(`reasons.${reason}`)}
        </span>
      </div>

      {detail && (
        <p className="text-sm leading-normal text-body break-keep">{detail}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-muted">
          {t("reportBy")} {reporter} · {createdAt}
        </span>
        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={pending}
          onClick={() => resolve("actioned")}
        >
          {t("markActioned")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="md"
          disabled={pending}
          onClick={() => resolve("dismissed")}
        >
          {t("markDismissed")}
        </Button>
      </div>

      {/* Only for a target that can be removed on its own. A report about a
          creator is answered with suspension, which lives on the creator list
          with its own confirmation — there is no single thing to hide. */}
      {(targetType === "item" || targetType === "update") &&
        (targetHidden ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-panel px-2.5 py-1 text-2xs font-semibold text-muted">
              {t("hiddenBadge")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={pending}
              onClick={restore}
            >
              {t("unhideItem")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              maxLength={300}
              placeholder={t("reasonLabel")}
              className="min-w-[200px] flex-1 rounded-md border border-line-2 bg-card px-3 py-1.5 text-sm text-ink outline-none focus:border-coral"
            />
            <Button
              type="button"
              variant="secondary"
              size="md"
              loading={pending}
              onClick={takedown}
            >
              {t("hideItem")}
            </Button>
          </div>
        ))}

      {error && <InlineMessage tone="error">{t(`errors.${error}`)}</InlineMessage>}
    </div>
  );
}

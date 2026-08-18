"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { resolveReportAction } from "@/app/report-actions";

/**
 * One open report, with the two outcomes that exist: it led to something, or it
 * didn't. Resolving is deliberately separate from suspending — this records a
 * judgement, the suspend control changes the world, and merging them would make
 * "dismissed" ambiguous about whether anything actually happened.
 */
export function ReportRow({
  reportId,
  targetType,
  targetLabel,
  targetHref,
  reason,
  detail,
  reporter,
  createdAt,
}: {
  reportId: string;
  targetType: "creator" | "item";
  targetLabel: string;
  targetHref: string | null;
  reason: string;
  detail: string | null;
  reporter: string;
  createdAt: string;
}) {
  const t = useTranslations("admin");
  const tr = useTranslations("report");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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

      {error && <InlineMessage tone="error">{t(`errors.${error}`)}</InlineMessage>}
    </div>
  );
}

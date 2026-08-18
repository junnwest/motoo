"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { replyToOrderIssueAction } from "@/lib/orderIssues";

/**
 * The creator's side of an order dispute (docs/PRELAUNCH.md #30).
 *
 * Inline on the order row rather than in a queue of its own: everything needed
 * to answer — the item, the buyer, their original note — is already in that
 * row, and the resolution is usually the cancel button two cells over.
 *
 * There is no "mark resolved" here on purpose. Closing the dispute is the fan's
 * call; a creator dismissing a complaint about their own delivery is the same
 * move as marking an undelivered order fulfilled, which is what brought the fan
 * here.
 */
export function OrderIssueReply({
  issueId,
  reason,
  detail,
  status,
  creatorReply,
}: {
  issueId: string;
  reason: string;
  detail: string;
  status: "open" | "replied" | "resolved" | "escalated";
  creatorReply: string | null;
}) {
  const t = useTranslations("creatorDashboard.issues");
  const tr = useTranslations("orderIssue");
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="w-[220px] rounded-md border border-coral-chip bg-coral-chip/30 p-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-coral-deep px-2 py-0.5 text-2xs font-semibold text-cream">
          {t("badge")}
        </span>
        {status === "escalated" && (
          <span className="text-2xs font-semibold text-coral-deep">
            {t("escalated")}
          </span>
        )}
      </div>

      <p className="mt-1.5 text-2xs font-semibold text-ink break-keep">
        {tr(`reasons.${reason}` as never)}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-2xs leading-relaxed text-body break-keep">
        {detail}
      </p>

      {creatorReply ? (
        <p className="mt-2 border-t border-coral-chip pt-2 text-2xs leading-relaxed text-muted break-keep">
          {t("replied")}: {creatorReply}
        </p>
      ) : (
        <>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder={t("replyPlaceholder")}
            aria-label={t("replyLabel")}
            className="mt-2 w-full resize-y rounded border border-line-2 bg-card px-2 py-1.5 text-2xs text-ink outline-none focus:border-coral"
          />
          <Button
            type="button"
            variant="primary"
            className="mt-1.5 w-full !px-2 !py-1 !text-2xs"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await replyToOrderIssueAction({ issueId, reply });
                if (res.ok) {
                  setReply("");
                  router.refresh();
                } else setError(res.error);
              })
            }
          >
            {t("reply")}
          </Button>
          {/* The cancel button is right there; say what it does for the fan so
              the creator does not treat a reply as the only lever. */}
          <p className="mt-1.5 text-2xs leading-relaxed text-muted break-keep">
            {t("hint")}
          </p>
        </>
      )}

      {error && (
        <InlineMessage tone="error" className="mt-2">
          {t(`errors.${error}` as never)}
        </InlineMessage>
      )}
    </div>
  );
}

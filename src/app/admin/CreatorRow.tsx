"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { suspendCreatorAction, restoreCreatorAction } from "./actions";

/**
 * One creator, with the only two levers that exist. The suspend control is a
 * form rather than a button because the reason is required — asking for it at
 * the moment of the decision is the only time anyone actually remembers it.
 */
export function CreatorRow({
  streamerId,
  handle,
  displayName,
  status,
  supporters,
  suspendedReason,
  suspendedBy,
}: {
  streamerId: string;
  handle: string;
  displayName: string;
  status: string;
  supporters: number;
  suspendedReason: string | null;
  suspendedBy: string | null;
}) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const suspended = status === "suspended";

  return (
    <div className="flex flex-col gap-3 border-b border-line-2 py-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-base font-bold text-ink">
            {displayName}{" "}
            <span className="font-medium text-muted">@{handle}</span>
          </div>
          <div className="text-xs text-muted">
            {t("supporters", { count: supporters })}
            {suspended && suspendedReason ? ` · ${suspendedReason}` : ""}
            {suspended && suspendedBy ? ` (${suspendedBy})` : ""}
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${
            suspended
              ? "bg-live/10 text-live"
              : status === "approved"
                ? "bg-sage-bg text-sage"
                : "bg-panel text-muted"
          }`}
        >
          {t(`status.${status}`)}
        </span>

        {suspended ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await restoreCreatorAction({ streamerId });
                if (!res.ok) setError(res.error);
              })
            }
          >
            {t("restore")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setOpen((v) => !v)}
          >
            {t("suspend")}
          </Button>
        )}
      </div>

      {open && !suspended && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            start(async () => {
              const res = await suspendCreatorAction({ streamerId, reason });
              if (res.ok) setOpen(false);
              else setError(res.error);
            });
          }}
        >
          <Input
            required
            minLength={3}
            label={t("reasonLabel")}
            fieldClassName="flex-1 min-w-[240px]"
            value={reason}
            disabled={pending}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button type="submit" variant="primary" size="md" loading={pending}>
            {t("confirmSuspend")}
          </Button>
        </form>
      )}

      {error && <InlineMessage tone="error">{t(`errors.${error}`)}</InlineMessage>}
    </div>
  );
}

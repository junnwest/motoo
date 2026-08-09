"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InlineMessage } from "@/components/ui/InlineMessage";
import {
  requestAccountDeletion,
  undoAccountDeletion,
} from "@/app/settings/account-actions";

/**
 * Data export + account deletion — PIPA's rights of access and erasure, neither
 * of which the product offered at all. `/settings` had profile picture,
 * nickname, handle and password, and no way to leave.
 *
 * Deletion is scheduled, not immediate, so the confirm dialog's job is to state
 * three things plainly: when it actually happens, that signing back in cancels
 * it, and what becomes of any unspent mochi. The last one is the part users
 * will care about most and the part a vague confirmation would hide.
 */
export function AccountSection({
  graceDays,
  unspentMochi,
  pendingDeletionAt,
}: {
  graceDays: number;
  /** Total unspent mochi across creators, stated before the user confirms. */
  unspentMochi: number;
  pendingDeletionAt: string | null;
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<string | null>(pendingDeletionAt);

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      const res = await requestAccountDeletion();
      if (res.ok) {
        setScheduled(res.deadline ?? null);
        setOpen(false);
        // The session was revoked server-side (tokenVersion bumped), so send
        // the user out through a real navigation rather than leaving them on a
        // page whose session no longer exists.
        window.location.assign("/");
      } else {
        setError(res.error);
      }
    });
  }

  function undo() {
    startTransition(async () => {
      const res = await undoAccountDeletion();
      if (res.ok) {
        setScheduled(null);
        router.refresh();
      }
    });
  }

  const deletionDate = scheduled
    ? new Intl.DateTimeFormat("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(scheduled))
    : null;

  return (
    <section className="rounded-xl bg-cream-warm-2 p-6 sm:p-7">
      <h2 className="text-lg font-extrabold tracking-[-0.02em] text-ink">
        {t("dangerTitle")}
      </h2>
      <p className="mt-1 text-sm text-body">{t("dangerSubtitle")}</p>

      {/* Export */}
      <div className="mt-6 border-t border-line-2 pt-5">
        <h3 className="text-base font-bold text-ink">{t("exportTitle")}</h3>
        <p className="mt-1 text-sm leading-relaxed text-body break-keep">
          {t("exportBody")}
        </p>
        {/* A plain link, not fetch(): the response is a file download, and
            letting the browser handle it keeps the filename header intact. */}
        <a
          href="/api/account/export"
          download
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg border-[1.5px] border-line-3 bg-white px-5 py-3 text-base font-bold text-ink transition-colors hover:border-coral/60"
        >
          {t("exportCta")}
        </a>
      </div>

      {/* Deletion */}
      <div className="mt-6 border-t border-line-2 pt-5">
        <h3 className="text-base font-bold text-ink">{t("deleteTitle")}</h3>
        {deletionDate ? (
          <>
            <InlineMessage tone="error" className="mt-2">
              {t("deleteScheduled", { date: deletionDate })}
            </InlineMessage>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-3"
              loading={pending}
              onClick={undo}
            >
              {t("deleteKeep")}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm leading-relaxed text-body break-keep">
              {t("deleteBody", { days: graceDays })}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-3 !border-live/40 !text-live"
              onClick={() => {
                setError(null);
                setOpen(true);
              }}
            >
              {t("deleteCta")}
            </Button>
          </>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        titleId="delete-account"
        closeLabel={tc("close")}
      >
        <h2
          id="delete-account"
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("deleteConfirmTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("deleteConfirmBody", { days: graceDays })}
        </p>
        <p className="mt-3 rounded-md bg-panel px-4 py-3 text-sm leading-relaxed text-muted-2 break-keep">
          {unspentMochi > 0
            ? t("deleteConfirmBalance", { count: unspentMochi })
            : t("deleteConfirmNoBalance")}
        </p>

        {error && (
          <InlineMessage tone="error" className="mt-4">
            {t(`deleteErrors.${error}` as never)}
          </InlineMessage>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            loading={pending}
            onClick={confirmDelete}
          >
            {t("deleteConfirmCta")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            {t("deleteKeep")}
          </Button>
        </div>
      </Modal>
    </section>
  );
}

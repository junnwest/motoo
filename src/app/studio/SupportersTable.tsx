"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Placeholder";
import { Mochi } from "@/components/Mochi";
import { InlineMessage } from "@/components/ui/InlineMessage";
import {
  blockSupporterAction,
  unblockSupporterAction,
} from "@/lib/block-actions";

export type DashboardSupporter = {
  backerId: string;
  nickname: string;
  avatarUrl: string | null;
  balance: number;
  mochiEarnedTotal: number;
  blocked: boolean;
};

/**
 * The creator's own supporters, with the block control (docs/PRELAUNCH.md #13).
 *
 * A creator's only lever over a fan used to be cancelling orders one at a time,
 * forever. Blocking stops new donations and follows and takes them off the
 * public leaderboard — but deliberately not their ability to spend mochi they
 * already hold, which the confirmation says out loud, because a creator should
 * know the block is not a way to keep someone's money.
 *
 * Blocked supporters stay listed, greyed, so the block is undoable from the
 * same place it was made. A list that dropped them would make unblocking
 * impossible from the UI.
 */
export function SupportersTable({
  supporters,
}: {
  supporters: DashboardSupporter[];
}) {
  const t = useTranslations("creatorDashboard.supporters");
  const tc = useTranslations("common");
  const router = useRouter();
  const [target, setTarget] = useState<DashboardSupporter | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (supporters.length === 0) {
    return <p className="text-sm text-muted">{t("empty")}</p>;
  }

  function unblock(backerId: string) {
    setError(null);
    start(async () => {
      const res = await unblockSupporterAction({ backerId });
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  return (
    <>
      <ul className="flex flex-col">
        {supporters.map((s) => (
          <li
            key={s.backerId}
            className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-2 py-3 ${
              s.blocked ? "opacity-55" : ""
            }`}
          >
            <Avatar name={s.nickname} src={s.avatarUrl} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-ink">
                {s.nickname}
              </div>
              {s.blocked && (
                <div className="text-2xs font-semibold text-coral-deep">
                  {t("blockedBadge")}
                </div>
              )}
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Mochi width={13} height={10} className="text-coral-deep" />
              {t("earned", { count: s.mochiEarnedTotal })}
            </span>
            <span className="text-xs text-muted">
              {t("balance", { count: s.balance })}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="!px-2.5 !py-1 !text-2xs"
              disabled={pending}
              onClick={() => {
                setError(null);
                if (s.blocked) unblock(s.backerId);
                else {
                  setReason("");
                  setTarget(s);
                }
              }}
            >
              {s.blocked ? t("unblock") : t("block")}
            </Button>
          </li>
        ))}
      </ul>

      {error && (
        <InlineMessage tone="error" className="mt-3">
          {t(`errors.${error}` as never)}
        </InlineMessage>
      )}

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        titleId="block-supporter"
        closeLabel={tc("close")}
      >
        <h2
          id="block-supporter"
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("confirmTitle", { name: target?.nickname ?? "" })}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("confirmBody")}
        </p>
        {/* The limit of a block, stated before the click rather than discovered
            afterwards when a blocked fan redeems something. */}
        <p className="mt-3 text-sm leading-relaxed text-muted break-keep">
          {t("confirmNote", { count: target?.balance ?? 0 })}
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink">{t("reasonLabel")}</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder={t("reasonPlaceholder")}
            className="mt-1.5 w-full resize-y rounded-md border border-line-2 bg-card px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
          <span className="mt-1 block text-xs text-muted break-keep">
            {t("reasonHelp")}
          </span>
        </label>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            variant="primary"
            loading={pending}
            className="w-full"
            onClick={() => {
              const backerId = target?.backerId;
              if (!backerId) return;
              setError(null);
              start(async () => {
                const res = await blockSupporterAction({ backerId, reason });
                if (res.ok) {
                  setTarget(null);
                  router.refresh();
                } else {
                  setError(res.error);
                }
              });
            }}
          >
            {t("block")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            className="w-full"
            onClick={() => setTarget(null)}
          >
            {tc("close")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

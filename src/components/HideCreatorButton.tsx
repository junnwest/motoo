"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toggleHideCreator } from "@/lib/block-actions";

/**
 * A fan hides a creator (docs/PRELAUNCH.md #13).
 *
 * Sits beside 신고 because they answer adjacent questions — "someone should
 * look at this" and "I don't want to see this" — and because a fan reaching for
 * one often wants the other. They stay separate controls: a report is a claim
 * about the creator, hiding is a statement about the fan's own feed, and
 * collapsing them would make every hide look like an accusation.
 *
 * Confirms before hiding, because it also drops the follow, and never confirms
 * before unhiding, which costs nothing.
 */
export function HideCreatorButton({
  streamerId,
  creatorName,
  hidden,
  signedIn,
}: {
  streamerId: string;
  creatorName: string;
  hidden: boolean;
  signedIn: boolean;
}) {
  const t = useTranslations("hideCreator");
  const tc = useTranslations("common");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  // Hiding is per-account, so there is nothing to hide it *from* when nobody is
  // signed in — the control is absent rather than a login prompt.
  if (!signedIn) return null;

  function submit() {
    start(async () => {
      const res = await toggleHideCreator(streamerId);
      if (res.ok) {
        setOpen(false);
        // Hidden creators vanish from explore and the rail, so the whole shell
        // has to re-render, not just this button.
        router.refresh();
      }
    });
  }

  if (hidden) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="!px-2 !py-1 !text-2xs"
        loading={pending}
        onClick={submit}
      >
        {t("undo")}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="md"
        className="!px-2 !py-1 !text-2xs"
        onClick={() => setOpen(true)}
      >
        {t("cta")}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        titleId={`hide-${streamerId}`}
        closeLabel={tc("close")}
      >
        <h2
          id={`hide-${streamerId}`}
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("confirmTitle", { name: creatorName })}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("confirmBody")}
        </p>
        {/* Said before the click: hiding does not touch mochi. A fan who has
            donated needs to know their balance survives, or the control reads
            as "give up what I hold". */}
        <p className="mt-3 text-sm leading-relaxed text-muted break-keep">
          {t("confirmNote")}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            variant="primary"
            loading={pending}
            onClick={submit}
            className="w-full"
          >
            {t("confirm")}
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

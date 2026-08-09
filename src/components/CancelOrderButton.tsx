"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { cancelOrderAction } from "@/app/s/[handle]/marketplace-actions";

/**
 * Lets a buyer cancel their own pending order and get the mochi back.
 *
 * Cancellation used to be creator-only, so a fan who redeemed the wrong item
 * had no way to undo it and had to go and ask the creator. Combined with
 * redemption being a two-tap, no-confirmation action, spending was both the
 * fastest and the least reversible thing in the product.
 *
 * Only rendered for `pending` orders — an instant item is recorded fulfilled at
 * redemption and a fulfilled request has already cost the creator work, so
 * neither can be taken back. `cancelOrderByBuyer` enforces that server-side
 * regardless of what this component chooses to render.
 *
 * Confirms first: this is the undo, but it is itself not undoable.
 */
export function CancelOrderButton({
  orderId,
  itemTitle,
  mochiSpent,
}: {
  orderId: string;
  itemTitle: string;
  mochiSpent: number;
}) {
  const t = useTranslations("myMochi");
  const tc = useTranslations("common");
  const tMarket = useTranslations("marketplace");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await cancelOrderAction({ orderId });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
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
        {t("cancelOrder")}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        titleId={`cancel-order-${orderId}`}
        closeLabel={tc("close")}
      >
        <h2
          id={`cancel-order-${orderId}`}
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("cancelConfirmTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("cancelConfirmBody", { item: itemTitle, count: mochiSpent })}
        </p>

        {error && (
          <InlineMessage tone="error" className="mt-4">
            {tMarket(`errors.${error}` as never)}
          </InlineMessage>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            variant="primary"
            loading={pending}
            onClick={submit}
            className="w-full"
          >
            {pending ? t("cancelling") : t("cancelConfirm")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={() => setOpen(false)}
            className="w-full"
          >
            {t("cancelKeep")}
          </Button>
        </div>
      </Modal>
    </>
  );
}

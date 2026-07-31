"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { formatCount } from "@/lib/format";
import { redeemItemAction } from "@/app/s/[handle]/marketplace-actions";

type ItemType = "digital" | "access" | "physical" | "session";
type Fulfillment = "instant" | "request";

type MarketItem = {
  id: string;
  title: string;
  description: string | null;
  priceMochi: number;
  itemType: ItemType;
  thumbnailKey: string | null;
  fulfillment: Fulfillment;
  stock: number | null;
  redeemedCount: number;
};

/**
 * User-side marketplace (spend) section, imported into the creator profile page.
 * Lists a creator's items and lets a user spend that creator's mochi on them.
 */
export function MarketplaceSection({
  handle,
  balance,
  loggedIn,
  items,
}: {
  handle: string;
  balance: number;
  loggedIn: boolean;
  items: MarketItem[];
}) {
  const t = useTranslations("marketplace");

  return (
    <section id="market" className="scroll-mt-24">
      <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink">
        {t("marketTitle")}
      </h2>
      <p className="mt-1.5 text-[15px] text-body">{t("marketSubtitle")}</p>

      {items.length === 0 ? (
        <p className="mt-6 rounded-[16px] border border-dashed border-line-3 bg-cream-warm/50 px-5 py-10 text-center text-[15px] text-muted">
          {t("marketEmpty")}
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              handle={handle}
              balance={balance}
              loggedIn={loggedIn}
              item={item}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ItemCard({
  handle,
  balance,
  loggedIn,
  item,
}: {
  handle: string;
  balance: number;
  loggedIn: boolean;
  item: MarketItem;
}) {
  const t = useTranslations("marketplace");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [doneInstant, setDoneInstant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = item.stock !== null ? item.stock - item.redeemedCount : null;
  const soldOut = remaining !== null && remaining <= 0;
  const needMore = balance < item.priceMochi;

  function confirm() {
    setError(null);
    startTransition(async () => {
      const res = await redeemItemAction({
        handle,
        itemId: item.id,
        note: note.trim() ? note.trim() : null,
      });
      if (res.ok) {
        setDone(true);
        setDoneInstant(res.instant);
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col rounded-[16px] border border-line-2 bg-card p-5">
      <div className="flex items-start gap-3">
        <ItemThumbnail
          thumbnailKey={item.thumbnailKey}
          itemType={item.itemType}
          size={48}
        />
        <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
          <h3 className="text-[16px] font-extrabold tracking-[-0.02em] text-ink">
            {item.title}
          </h3>
          <div className="flex flex-none flex-col items-end gap-1">
            <span className="rounded-full bg-coral-chip px-2.5 py-1 text-[11px] font-semibold text-coral-deep">
              {t(`types.${item.itemType}`)}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                item.fulfillment === "instant"
                  ? "bg-sage-bg text-sage"
                  : "bg-panel text-muted-2"
              }`}
            >
              {t(`fulfillment.${item.fulfillment}`)}
            </span>
          </div>
        </div>
      </div>

      {item.description && (
        <p className="mt-2 text-[14px] leading-[1.5] text-body">
          {item.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <Mochi width={16} height={12} />
        <span className="text-[16px] font-extrabold text-ink">
          {formatCount(item.priceMochi)}
        </span>
        <span className="text-[13px] text-muted">
          {t("priceMochi", { count: item.priceMochi })}
        </span>
      </div>

      {/* stock line */}
      {item.stock !== null && (
        <p
          className={`mt-2 text-[13px] font-semibold ${
            soldOut ? "text-live" : "text-muted-2"
          }`}
        >
          {soldOut
            ? t("soldOut")
            : t("stockLeft", { count: remaining as number })}
        </p>
      )}

      <div className="mt-auto pt-4">
        {!loggedIn ? (
          <ButtonLink
            href="/login"
            variant="secondary"
            size="md"
            className="w-full"
          >
            {t("redeem")}
          </ButtonLink>
        ) : open ? (
          <div>
            <textarea
              value={note}
              disabled={pending}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              rows={3}
              className="w-full resize-none rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60"
            />
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-none"
                disabled={pending}
                onClick={() => setOpen(false)}
              >
                ✕
              </Button>
              <Button
                type="button"
                variant="primary"
                className="w-full"
                disabled={pending || soldOut || needMore}
                onClick={confirm}
              >
                {pending ? t("redeeming") : t("redeem")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="primary"
            className="w-full"
            disabled={soldOut || needMore || pending}
            onClick={() => {
              setDone(false);
              setError(null);
              setOpen(true);
            }}
          >
            {soldOut ? t("soldOut") : t("redeem")}
          </Button>
        )}

        {needMore && !soldOut && (
          <p className="mt-2 text-[13px] text-muted">{t("needMore")}</p>
        )}

        {done && (
          <p className="mt-2 rounded-[12px] bg-sage-bg px-4 py-2.5 text-[14px] font-semibold text-sage">
            {t(doneInstant ? "redeemedInstant" : "redeemed")}
          </p>
        )}
        {error && (
          <p className="mt-2 text-[14px] font-semibold text-live">
            {t(`errors.${error}`)}
          </p>
        )}
      </div>
    </div>
  );
}

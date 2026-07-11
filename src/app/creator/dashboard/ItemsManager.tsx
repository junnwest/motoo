"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MarketplaceItemType } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { formatCount } from "@/lib/format";
import { upsertItem, deleteItem } from "./actions";

export type DashboardItem = {
  id: string;
  title: string;
  description: string | null;
  priceMochi: number;
  itemType: MarketplaceItemType;
  stock: number | null;
  redeemedCount: number;
  active: boolean;
};

const ITEM_TYPES: MarketplaceItemType[] = [
  MarketplaceItemType.digital,
  MarketplaceItemType.access,
  MarketplaceItemType.physical,
  MarketplaceItemType.session,
];

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60";

export function ItemsManager({ items }: { items: DashboardItem[] }) {
  const t = useTranslations("creatorDashboard");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button
          type="button"
          variant="dark"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
        >
          {t("items.addNew")}
        </Button>
      </div>

      {creating ? (
        <ItemForm
          onClose={() => setCreating(false)}
          submitLabel={t("items.add")}
        />
      ) : null}

      {items.length === 0 && !creating ? (
        <div className="rounded-[16px] border border-line-2 bg-card p-6 text-[15px] text-muted">
          {t("items.empty")}
        </div>
      ) : null}

      {items.map((item) =>
        editingId === item.id ? (
          <ItemForm
            key={item.id}
            item={item}
            onClose={() => setEditingId(null)}
            submitLabel={t("items.save")}
          />
        ) : (
          <ItemCard
            key={item.id}
            item={item}
            onEdit={() => {
              setEditingId(item.id);
              setCreating(false);
            }}
          />
        ),
      )}
    </div>
  );
}

function ItemCard({
  item,
  onEdit,
}: {
  item: DashboardItem;
  onEdit: () => void;
}) {
  const t = useTranslations("creatorDashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      await deleteItem(item.id);
      router.refresh();
    });
  }

  const remaining = item.stock === null ? null : item.stock - item.redeemedCount;

  return (
    <div className="rounded-[16px] border border-line-2 bg-card p-5">
      {/*
        The card body is the edit trigger — clicking it expands the inline edit
        form. Its accessible name is the item title (user data), so no "edit" UI
        string is needed (the messages catalog has no dedicated edit key). Delete
        is a separate sibling button, so the two controls never nest.
      */}
      <button
        type="button"
        onClick={onEdit}
        className="block w-full rounded-[12px] text-left transition-colors hover:bg-black/[.02]"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink">
            {item.title}
          </h3>
          <span className="rounded-full bg-panel px-2.5 py-0.5 text-[12px] font-semibold text-muted-2">
            {t(`items.types.${item.itemType}`)}
          </span>
          {!item.active ? (
            <span className="rounded-full bg-panel px-2.5 py-0.5 text-[12px] font-semibold text-muted">
              {t("mochi.activeOff")}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="mt-1.5 text-[14px] text-muted">{item.description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
          <span className="flex items-center gap-1.5 font-semibold text-body">
            <Mochi width={16} height={12} />
            {formatCount(item.priceMochi)}
          </span>
          <span>{t("items.redeemed", { count: item.redeemedCount })}</span>
          {remaining !== null ? (
            <span>
              {t("items.stock")}: {formatCount(remaining)}
            </span>
          ) : null}
        </div>
      </button>

      <div className="mt-4 flex gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onDelete}
          disabled={isPending}
        >
          {t("items.delete")}
        </Button>
      </div>
    </div>
  );
}

function ItemForm({
  item,
  onClose,
  submitLabel,
}: {
  item?: DashboardItem;
  onClose: () => void;
  submitLabel: string;
}) {
  const t = useTranslations("creatorDashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(String(item?.priceMochi ?? 10));
  const [itemType, setItemType] = useState<MarketplaceItemType>(
    item?.itemType ?? MarketplaceItemType.digital,
  );
  const [stock, setStock] = useState(
    item?.stock === null || item?.stock === undefined
      ? ""
      : String(item.stock),
  );
  const [active, setActive] = useState(item?.active ?? true);
  const [error, setError] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    const trimmedStock = stock.trim();
    startTransition(async () => {
      const res = await upsertItem({
        id: item?.id,
        title: title.trim(),
        description: description.trim(),
        priceMochi: Math.trunc(Number(price)),
        itemType,
        stock: trimmedStock === "" ? null : Math.trunc(Number(trimmedStock)),
        active,
      });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(true);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[16px] border border-line-2 bg-panel p-5"
    >
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="item-title" className={labelClass}>
            {t("items.name")}
          </label>
          <input
            id="item-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("items.namePlaceholder")}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="item-description" className={labelClass}>
            {t("items.description")}
          </label>
          <textarea
            id="item-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("items.descriptionPlaceholder")}
            className={`${inputClass} resize-y`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="item-price" className={labelClass}>
              {t("items.price")}
            </label>
            <input
              id="item-price"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="item-type" className={labelClass}>
              {t("items.type")}
            </label>
            <select
              id="item-type"
              value={itemType}
              onChange={(e) =>
                setItemType(e.target.value as MarketplaceItemType)
              }
              className={inputClass}
            >
              {ITEM_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`items.types.${type}`)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="item-stock" className={labelClass}>
              {t("items.stock")}
            </label>
            <input
              id="item-stock"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-5 w-5 shrink-0 rounded-[6px] border border-line-3 accent-coral"
          />
          <span className="text-[15px] font-semibold text-ink">
            {t("items.active")}
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" disabled={isPending}>
            {submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("items.cancel")}
          </Button>
          {error ? (
            <span className="text-[13px] font-semibold text-live">
              {t("saveError")}
            </span>
          ) : null}
        </div>
      </div>
    </form>
  );
}

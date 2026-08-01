"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { MarketplaceItemType, FulfillmentMode } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { ItemThumbnail } from "@/components/ItemThumbnail";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { formatCount } from "@/lib/format";
import { suggestionsForType } from "@/lib/itemSuggestions";
import { THUMBNAIL_GROUPS } from "@/lib/itemThumbnails";
import { ITEM_COVER_SPEC } from "@/lib/imageUpload";
import { InfoTooltip } from "./InfoTooltip";
import { upsertItem, deleteItem } from "./actions";

/** Seed values for a new item, e.g. from a suggestion chip. */
type ItemDraft = Pick<
  DashboardItem,
  | "title"
  | "description"
  | "priceMochi"
  | "itemType"
  | "thumbnailKey"
  | "coverImage"
  | "fulfillment"
>;

const EMPTY_DRAFT: ItemDraft = {
  title: "",
  description: "",
  priceMochi: 10,
  itemType: MarketplaceItemType.digital,
  thumbnailKey: null,
  coverImage: null,
  fulfillment: FulfillmentMode.request,
};

export type DashboardItem = {
  id: string;
  title: string;
  description: string | null;
  priceMochi: number;
  itemType: MarketplaceItemType;
  thumbnailKey: string | null;
  coverImage: string | null;
  fulfillment: FulfillmentMode;
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

export function ItemsManager({
  items,
  creatorType,
}: {
  items: DashboardItem[];
  creatorType: string | null;
}) {
  const t = useTranslations("creatorDashboard");
  // A non-null draft means the create form is open, seeded with these values.
  // `draftSeq` bumps on every open so the form remounts and re-seeds its state.
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [draftSeq, setDraftSeq] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  function openCreate(seed: ItemDraft | null) {
    setDraft(seed ?? EMPTY_DRAFT);
    setDraftSeq((n) => n + 1);
    setEditingId(null);
  }

  return (
    <section id="items" className="scroll-mt-24">
      {/* Header mirrors the Section component (border-t divider + title) so it
          lines up with the orders column; the "새 아이템" button sits at the right. */}
      <header className="mb-5 flex items-start justify-between gap-4 border-t border-line-2 pt-8">
        <div>
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">
            {t("items.title")}
          </h2>
          <p className="mt-1 max-w-[560px] text-[14px] text-muted">
            {t("items.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          variant="dark"
          onClick={() => openCreate(null)}
          className="flex-none"
        >
          {t("items.addNew")}
        </Button>
      </header>

      <div className="flex flex-col gap-4">
        <SuggestionPanel creatorType={creatorType} onPick={openCreate} />

      {draft ? (
        <ItemForm
          key={draftSeq}
          initial={draft}
          onClose={() => setDraft(null)}
          submitLabel={t("items.add")}
        />
      ) : null}

      {items.length === 0 && !draft ? (
        <div className="rounded-[16px] border border-line-2 bg-card p-6 text-[15px] text-muted">
          {t("items.empty")}
        </div>
      ) : null}

      {/* Cards pack two-up on wider viewports; an inline edit form spans the row. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="col-span-full">
              <ItemForm
                item={item}
                onClose={() => setEditingId(null)}
                submitLabel={t("items.save")}
              />
            </div>
          ) : (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={() => {
                setEditingId(item.id);
                setDraft(null);
              }}
            />
          ),
        )}
        </div>
      </div>
    </section>
  );
}

/**
 * Ready-made item templates for the creator's type, grouped by intent. A chip is
 * a starting point — picking one just opens the create form pre-filled, so the
 * creator still edits price, wording, and stock before it's live.
 */
function SuggestionPanel({
  creatorType,
  onPick,
}: {
  creatorType: string | null;
  onPick: (seed: ItemDraft) => void;
}) {
  const t = useTranslations("creatorDashboard");
  const groups = suggestionsForType(creatorType);
  if (groups.length === 0) return null;

  return (
    <div className="rounded-[16px] border border-line-2 bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-bold text-ink">
          {t("items.suggestions.label")}
        </h3>
        <InfoTooltip
          label={t("helpLabel")}
          items={[t("items.suggestions.hint")]}
        />
      </div>
      <div className="mt-4 flex flex-col gap-4">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-2">
              {t(`items.suggestions.groups.${group.key}` as never)}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.items.map((s) => {
                const title = t(
                  `items.suggestions.items.${s.key}.title` as never,
                );
                const description = t(
                  `items.suggestions.items.${s.key}.desc` as never,
                );
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() =>
                      onPick({
                        title,
                        description,
                        priceMochi: s.priceMochi,
                        itemType: s.itemType,
                        thumbnailKey: s.thumbnailKey,
                        // Suggestions seed a curated tile, never a photo — a
                        // cover is the creator's own to add.
                        coverImage: null,
                        fulfillment: s.fulfillment,
                      })
                    }
                    className="flex items-center gap-1.5 rounded-full border border-line-3 bg-white px-3.5 py-2 text-[13.5px] font-medium text-ink transition-colors hover:border-coral/60 hover:bg-coral-chip"
                  >
                    <span aria-hidden="true" className="text-muted-2">
                      +
                    </span>
                    {title}
                    <span className="flex items-center gap-0.5 text-[12px] text-muted-2">
                      <Mochi width={13} height={10} />
                      {formatCount(s.priceMochi)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
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
    <div className="flex h-full flex-col overflow-hidden rounded-[16px] border border-line-2 bg-card">
      {item.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverImage}
          alt=""
          className="aspect-[16/9] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-1 flex-col p-5">
      <div className="flex items-start gap-3">
        {item.coverImage ? null : (
          <ItemThumbnail
            thumbnailKey={item.thumbnailKey}
            itemType={item.itemType}
            size={44}
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[17px] font-extrabold tracking-[-0.02em] text-ink break-keep">
              {item.title}
            </h3>
            <span className="rounded-full bg-panel px-2.5 py-0.5 text-[12px] font-semibold text-muted-2">
              {t(`items.types.${item.itemType}`)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                item.fulfillment === "instant"
                  ? "bg-sage-bg text-sage"
                  : "bg-coral-chip text-coral-deep"
              }`}
            >
              {t(`items.fulfillment.${item.fulfillment}`)}
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
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
        <span className="flex items-center gap-1.5 font-semibold text-body">
          <Mochi width={16} height={12} />
          {formatCount(item.priceMochi)}
        </span>
        <span>{t("items.redeemed", { count: item.redeemedCount })}</span>
        {remaining !== null ? (
          <span>{t("items.stockLeft", { count: remaining })}</span>
        ) : null}
      </div>

      <div className="mt-auto flex gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onEdit} disabled={isPending}>
          {t("items.edit")}
        </Button>
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
    </div>
  );
}

/**
 * Curated thumbnail picker. A `null` value means "use the itemType default" —
 * shown as the first swatch, which live-previews whatever the current type
 * resolves to. Selecting the active swatch again clears back to that default.
 */
function ThumbnailPicker({
  value,
  itemType,
  onChange,
}: {
  value: string | null;
  itemType: MarketplaceItemType;
  onChange: (key: string | null) => void;
}) {
  const t = useTranslations("creatorDashboard");

  function swatchClass(selected: boolean) {
    return `rounded-[12px] p-0.5 transition-shadow ${
      selected
        ? "ring-2 ring-coral ring-offset-1 ring-offset-panel"
        : "ring-1 ring-line-3 hover:ring-coral/50"
    }`;
  }

  return (
    <div>
      <span className={labelClass}>{t("items.thumbnails.label")}</span>
      <div className="flex flex-col gap-3 rounded-[12px] border border-line-3 bg-white p-3">
        {/* Default (itemType-derived) swatch. */}
        <div>
          <div className="mb-1.5 text-[12px] font-semibold text-muted-2">
            {t("items.thumbnails.groups.default")}
          </div>
          <button
            type="button"
            aria-pressed={value === null}
            onClick={() => onChange(null)}
            className={swatchClass(value === null)}
          >
            <ItemThumbnail thumbnailKey={null} itemType={itemType} size={40} />
          </button>
        </div>

        {THUMBNAIL_GROUPS.map((group) => (
          <div key={group.key}>
            <div className="mb-1.5 text-[12px] font-semibold text-muted-2">
              {t(`items.thumbnails.groups.${group.key}` as never)}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.assets.map((asset) => {
                const selected = value === asset.key;
                return (
                  <button
                    key={asset.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChange(selected ? null : asset.key)}
                    className={swatchClass(selected)}
                  >
                    <ItemThumbnail
                      thumbnailKey={asset.key}
                      itemType={itemType}
                      size={40}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Fulfillment-mode selector. `instant` settles the redemption on purchase (e.g. a
 * vote); `request` files it in the creator's pending order list to act on (e.g. a
 * mission). Two-button segmented control with a mode-specific hint.
 */
function FulfillmentPicker({
  value,
  onChange,
}: {
  value: FulfillmentMode;
  onChange: (mode: FulfillmentMode) => void;
}) {
  const t = useTranslations("creatorDashboard");
  const modes: FulfillmentMode[] = [
    FulfillmentMode.instant,
    FulfillmentMode.request,
  ];

  return (
    <div>
      <span className={labelClass}>{t("items.fulfillment.label")}</span>
      <div className="grid grid-cols-2 gap-2">
        {modes.map((mode) => {
          const selected = value === mode;
          return (
            <button
              key={mode}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(mode)}
              className={`rounded-[12px] border px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-coral bg-coral-chip"
                  : "border-line-3 bg-white hover:border-coral/50"
              }`}
            >
              <span className="block text-[14px] font-bold text-ink">
                {t(`items.fulfillment.${mode}`)}
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                {t(`items.fulfillment.${mode}Hint`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ItemForm({
  item,
  initial,
  onClose,
  submitLabel,
}: {
  /** Present when editing an existing item (carries its id). */
  item?: DashboardItem;
  /** Seed values when creating (blank form or a picked suggestion). */
  initial?: ItemDraft;
  onClose: () => void;
  submitLabel: string;
}) {
  const t = useTranslations("creatorDashboard");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const seed = item ?? initial ?? EMPTY_DRAFT;
  const [title, setTitle] = useState(seed.title ?? "");
  const [description, setDescription] = useState(seed.description ?? "");
  const [price, setPrice] = useState(String(seed.priceMochi ?? 10));
  const [itemType, setItemType] = useState<MarketplaceItemType>(
    seed.itemType ?? MarketplaceItemType.digital,
  );
  const [thumbnailKey, setThumbnailKey] = useState<string | null>(
    seed.thumbnailKey ?? null,
  );
  const [coverImage, setCoverImage] = useState<string | null>(
    seed.coverImage ?? null,
  );
  const [fulfillment, setFulfillment] = useState<FulfillmentMode>(
    seed.fulfillment ?? FulfillmentMode.request,
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
        thumbnailKey,
        coverImage,
        fulfillment,
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

        {/* Cover photo first: when set it's what a fan actually sees on the
            item card, and the curated tile below becomes the fallback. */}
        <ImagePicker
          value={coverImage}
          onChange={setCoverImage}
          spec={ITEM_COVER_SPEC}
          shape="cover"
          label={t("items.cover.label")}
          disabled={isPending}
        />

        <ThumbnailPicker
          value={thumbnailKey}
          itemType={itemType}
          onChange={setThumbnailKey}
        />

        <FulfillmentPicker value={fulfillment} onChange={setFulfillment} />

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

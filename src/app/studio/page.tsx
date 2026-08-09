import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorDashboard, getUpdatesForCreator } from "@/lib/streamers";
import { formatCount } from "@/lib/format";
import { CreatorFacet } from "@/components/CreatorFacet";
import { isCreatorType, ALL_CATEGORIES } from "@/lib/creatorTaxonomy";
import { SettingsButton } from "./SettingsButton";
import { MochiSettingsForm } from "./MochiSettingsForm";
import { ItemsManager, type DashboardItem } from "./ItemsManager";
import { OrdersTable, type DashboardOrder } from "./OrdersTable";
import { UpdatesManager } from "./UpdatesManager";
import { InfoTooltip } from "./InfoTooltip";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col justify-center rounded-[16px] border border-line-2 bg-card p-5">
      <div className="text-[26px] font-extrabold tracking-[-0.02em] text-ink">
        {value}
      </div>
      <div className="mt-1 text-[13px] text-muted">{label}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="font-bold text-ink">{value}</dd>
    </div>
  );
}

/**
 * Studio-local section shell. Named distinctly from components/ui/Section,
 * which it is NOT a variant of: that one is a bare content-shelf heading for
 * consumer pages; this is a console row with a top divider, a subtitle, an
 * action slot and an optional fill. Two components called Section with
 * different contracts was a trap for whoever imported the wrong one.
 */
function StudioSection({
  id,
  title,
  subtitle,
  children,
  divider = true,
  action,
  fill = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  // The top rule separates stacked rows; drop it when a section shares a row
  // with the borderless overview (row 1) so there's no stray half-width line.
  divider?: boolean;
  // Optional right-aligned header slot (info tooltip, action button, …).
  action?: ReactNode;
  // Make the body grow to fill the column height (equal-height rows).
  fill?: boolean;
}) {
  // scroll-mt keeps the section clear of the sticky top bar when jumped to.
  return (
    <section id={id} className={`scroll-mt-24 ${fill ? "flex flex-col" : ""}`}>
      <header className={`mb-5 ${divider ? "border-t border-line-2 pt-8" : ""}`}>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">
            {title}
          </h2>
          {action ? <div className="flex-none">{action}</div> : null}
        </div>
        {subtitle ? (
          <p className="mt-1 max-w-[560px] text-[14px] text-muted">{subtitle}</p>
        ) : null}
      </header>
      {fill ? (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

/**
 * Studio dashboard — everything on one page (overview + mochi issuance + market
 * items + orders). A web app has the room, so the creator never has to page
 * between routes; the sidebar just jumps to each section. All sections read
 * from a single getCreatorDashboard() call.
 */
export default async function CreatorDashboardHome() {
  const creator = await getCurrentCreator();
  if (!creator) return null;

  const [data, updates] = await Promise.all([
    getCreatorDashboard(creator.id),
    getUpdatesForCreator(creator.id),
  ]);
  if (!data) return null;

  const t = await getTranslations("creatorDashboard");
  const tax = await getTranslations("creatorTaxonomy");

  const issuanceRaw = data.mochiIssuance;
  const issuance = issuanceRaw
    ? {
        pricePerMochiKrw: issuanceRaw.pricePerMochiKrw,
        goalQuantity: issuanceRaw.goalQuantity,
        grantedQuantity: issuanceRaw.grantedQuantity,
        active: issuanceRaw.active,
      }
    : null;

  const items: DashboardItem[] = data.marketplaceItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    priceMochi: item.priceMochi,
    itemType: item.itemType,
    thumbnailKey: item.thumbnailKey,
    coverImage: item.coverImage,
    fulfillment: item.fulfillment,
    stock: item.stock,
    redeemedCount: item.redeemedCount,
    active: item.active,
  }));

  const orders: DashboardOrder[] = data.orders.map((o) => ({
    id: o.id,
    itemTitle: o.item.title,
    fan: o.backer.nickname,
    mochiSpent: o.mochiSpent,
    note: o.note,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  const pendingOrders = data.orders.filter(
    (o) => o.status === "pending",
  ).length;
  const percent = issuanceRaw
    ? issuanceRaw.goalQuantity > 0
      ? Math.round(
          (issuanceRaw.grantedQuantity / issuanceRaw.goalQuantity) * 100,
        )
      : 0
    : 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Row 1 — overview + mochi issuance. Columns stretch to equal height; the
          overview's three blocks each grow to fill a third, so there's no gap. */}
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_minmax(0,480px)]">
        <section id="overview" className="flex scroll-mt-24 flex-col">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[34px] font-extrabold tracking-[-0.02em] text-ink sm:text-[38px]">
                {t("welcome", { name: creator.displayName })}
              </h1>
              <CreatorFacet
                variant="text"
                className="mt-1.5"
                typeLabel={
                  creator.creatorType && isCreatorType(creator.creatorType)
                    ? tax(`types.${creator.creatorType}`)
                    : null
                }
                categoryLabel={
                  ALL_CATEGORIES.includes(creator.category)
                    ? tax(`categories.${creator.category}`)
                    : creator.category
                }
              />
            </div>
            <SettingsButton label={t("settings.button")} />
          </div>

          {/* Stats / progress / summary each flex-1 → equal thirds of the column. */}
          <div className="mt-6 flex flex-1 flex-col gap-4">
            <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile
                label={t("statSold")}
                value={formatCount(issuanceRaw?.lifetimeGranted ?? 0)}
              />
              <StatTile
                label={t("statGoal")}
                value={formatCount(issuance?.goalQuantity ?? 0)}
              />
              <StatTile
                label={t("statHolders")}
                value={formatCount(data._count.mochiHoldings)}
              />
              <StatTile
                label={t("statPendingOrders")}
                value={formatCount(pendingOrders)}
              />
              <StatTile
                label={t("statItems")}
                value={formatCount(data.marketplaceItems.length)}
              />
            </div>

            {issuance ? (
              <div className="flex flex-1 flex-col justify-center rounded-[16px] border border-line-2 bg-card p-5">
                <div className="mb-2 flex items-center justify-between text-[13px] font-semibold text-muted-2">
                  <span>{t("statGoal")}</span>
                  <span>{t("goalProgress", { percent })}</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-panel">
                  <div
                    className="h-full rounded-full bg-coral"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {issuance ? (
              <div className="flex flex-1 flex-col rounded-[16px] border border-line-2 bg-card p-5">
                <h3 className="mb-3 text-[15px] font-bold text-ink">
                  {t("mochi.summaryTitle")}
                </h3>
                <dl className="flex flex-1 flex-col justify-between gap-2.5 text-[14px]">
                  <SummaryRow
                    label={t("mochi.summaryPrice")}
                    value={`${issuance.pricePerMochiKrw.toLocaleString("ko-KR")}원`}
                  />
                  <SummaryRow
                    label={t("mochi.summaryTotal")}
                    value={`${(issuance.pricePerMochiKrw * issuance.goalQuantity).toLocaleString("ko-KR")}원`}
                  />
                  <SummaryRow
                    label={t("mochi.summarySold")}
                    value={`${formatCount(issuance.grantedQuantity)} / ${formatCount(issuance.goalQuantity)}`}
                  />
                  <SummaryRow
                    label={t("mochi.summaryRemaining")}
                    value={formatCount(
                      Math.max(
                        issuance.goalQuantity - issuance.grantedQuantity,
                        0,
                      ),
                    )}
                  />
                </dl>
              </div>
            ) : null}
          </div>
        </section>

        <StudioSection
          id="mochi"
          title={t("mochi.title")}
          divider={false}
          fill
          action={
            <InfoTooltip
              label={t("helpLabel")}
              items={[
                t("mochi.subtitle"),
                t("mochi.twoActions"),
                t("mochi.priceOnlyUpHint"),
                t("mochi.activeOn"),
              ]}
            />
          }
        >
          <MochiSettingsForm issuance={issuance} />
        </StudioSection>
      </div>

      {/* Row 2 — orders + market items. Market items get the wider column
          (more room for suggestions + item cards) than the orders table. */}
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:items-start">
        <StudioSection
          id="orders"
          title={t("orders.title")}
          action={
            <InfoTooltip
              label={t("helpLabel")}
              items={[t("orders.subtitle")]}
            />
          }
        >
          <OrdersTable orders={orders} />
        </StudioSection>

        {/* ItemsManager renders its own section header so the "새 아이템" button
            can sit at the header's right (it owns the create-form state). */}
        <ItemsManager items={items} creatorType={creator.creatorType} />

        {/* Same pattern: owns its own composer state, so it owns its header. */}
        <UpdatesManager updates={updates} />
      </div>
    </div>
  );
}

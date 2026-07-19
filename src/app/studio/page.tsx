import { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorDashboard } from "@/lib/streamers";
import { formatCount } from "@/lib/format";
import { MochiSettingsForm } from "./MochiSettingsForm";
import { ItemsManager, type DashboardItem } from "./ItemsManager";
import { OrdersTable, type DashboardOrder } from "./OrdersTable";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-line-2 bg-card p-5">
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

function Section({
  id,
  title,
  subtitle,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  // scroll-mt keeps the section clear of the sticky top bar when jumped to.
  return (
    <section id={id} className="scroll-mt-24">
      <header className="mb-5 border-t border-line-2 pt-8">
        <h2 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        <p className="mt-1 max-w-[560px] text-[14px] text-muted">{subtitle}</p>
      </header>
      {children}
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

  const data = await getCreatorDashboard(creator.id);
  if (!data) return null;

  const t = await getTranslations("creatorDashboard");

  const issuanceRaw = data.mochiIssuance;
  const issuance = issuanceRaw
    ? {
        pricePerMochiKrw: issuanceRaw.pricePerMochiKrw,
        goalQuantity: issuanceRaw.goalQuantity,
        soldQuantity: issuanceRaw.soldQuantity,
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
      ? Math.round((issuanceRaw.soldQuantity / issuanceRaw.goalQuantity) * 100)
      : 0
    : 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Overview */}
      <section id="overview" className="scroll-mt-24">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          {t("welcome", { name: creator.displayName })}
        </h1>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile
            label={t("statSold")}
            value={formatCount(issuanceRaw?.lifetimeSold ?? 0)}
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
          <div className="mt-4 rounded-[16px] border border-line-2 bg-card p-5">
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
      </section>

      {/* Narrow mochi column + wide market-items column, side by side on wide screens. */}
      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,440px)_1fr]">
        <Section
          id="mochi"
          title={t("mochi.title")}
          subtitle={t("mochi.subtitle")}
        >
          <div className="flex flex-col gap-4">
            <MochiSettingsForm issuance={issuance} />
            {issuance ? (
              <div className="rounded-[16px] border border-line-2 bg-card p-5">
                <h3 className="mb-3 text-[15px] font-bold text-ink">
                  {t("mochi.summaryTitle")}
                </h3>
                <dl className="flex flex-col gap-2.5 text-[14px]">
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
                    value={`${formatCount(issuance.soldQuantity)} / ${formatCount(issuance.goalQuantity)}`}
                  />
                  <SummaryRow
                    label={t("mochi.summaryRemaining")}
                    value={formatCount(
                      Math.max(issuance.goalQuantity - issuance.soldQuantity, 0),
                    )}
                  />
                </dl>
              </div>
            ) : null}
          </div>
        </Section>

        <Section
          id="items"
          title={t("items.title")}
          subtitle={t("items.subtitle")}
        >
          <ItemsManager items={items} creatorType={creator.creatorType} />
        </Section>
      </div>

      {/* Orders is a wide table — give it the full frame. */}
      <Section
        id="orders"
        title={t("orders.title")}
        subtitle={t("orders.subtitle")}
      >
        <OrdersTable orders={orders} />
      </Section>
    </div>
  );
}

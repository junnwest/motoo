import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorDashboard } from "@/lib/streamers";
import { OrdersTable, type DashboardOrder } from "../OrdersTable";

export default async function CreatorOrdersPage() {
  const creator = await getCurrentCreator();
  if (!creator) return null;

  const data = await getCreatorDashboard(creator.id);
  if (!data) return null;

  const t = await getTranslations("creatorDashboard");

  const orders: DashboardOrder[] = data.orders.map((o) => ({
    id: o.id,
    itemTitle: o.item.title,
    fan: o.backer.nickname,
    mochiSpent: o.mochiSpent,
    note: o.note,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          {t("orders.title")}
        </h1>
        <p className="mt-1.5 max-w-[560px] text-[15px] text-muted">
          {t("orders.subtitle")}
        </p>
      </header>

      <OrdersTable orders={orders} />
    </div>
  );
}

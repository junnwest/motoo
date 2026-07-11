import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorDashboard } from "@/lib/streamers";
import { ItemsManager, type DashboardItem } from "../ItemsManager";

export default async function CreatorItemsPage() {
  const creator = await getCurrentCreator();
  if (!creator) return null;

  const data = await getCreatorDashboard(creator.id);
  if (!data) return null;

  const t = await getTranslations("creatorDashboard");

  const items: DashboardItem[] = data.marketplaceItems.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    priceMochi: item.priceMochi,
    itemType: item.itemType,
    stock: item.stock,
    redeemedCount: item.redeemedCount,
    active: item.active,
  }));

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          {t("items.title")}
        </h1>
        <p className="mt-1.5 max-w-[560px] text-[15px] text-muted">
          {t("items.subtitle")}
        </p>
      </header>

      <ItemsManager items={items} />
    </div>
  );
}

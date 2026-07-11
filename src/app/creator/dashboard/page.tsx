import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorDashboard } from "@/lib/streamers";
import { formatCount } from "@/lib/format";

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

export default async function CreatorDashboardHome() {
  const creator = await getCurrentCreator();
  if (!creator) return null;

  const data = await getCreatorDashboard(creator.id);
  if (!data) return null;

  const t = await getTranslations("creatorDashboard");

  const issuance = data.mochiIssuance;
  const pendingOrders = data.orders.filter(
    (o) => o.status === "pending",
  ).length;
  const percent = issuance
    ? issuance.goalQuantity > 0
      ? Math.round((issuance.soldQuantity / issuance.goalQuantity) * 100)
      : 0
    : 0;

  return (
    <div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        {t("welcome", { name: creator.displayName })}
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatTile
          label={t("statSold")}
          value={formatCount(issuance?.soldQuantity ?? 0)}
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
        <div className="mt-6 rounded-[16px] border border-line-2 bg-card p-5">
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
      ) : (
        <div className="mt-6 rounded-[16px] border border-line-2 bg-card p-6">
          <p className="text-[15px] text-body">{t("notOnboarded")}</p>
          <Link
            href="/creator/dashboard/mochi"
            className="mt-3 inline-block text-[15px] font-semibold text-coral-deep hover:underline"
          >
            {t("setupMochi")}
          </Link>
        </div>
      )}
    </div>
  );
}

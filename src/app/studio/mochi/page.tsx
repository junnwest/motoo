import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { getCreatorDashboard } from "@/lib/streamers";
import { MochiSettingsForm } from "../MochiSettingsForm";

export default async function CreatorMochiPage() {
  const creator = await getCurrentCreator();
  if (!creator) return null;

  const data = await getCreatorDashboard(creator.id);
  if (!data) return null;

  const t = await getTranslations("creatorDashboard");

  const issuance = data.mochiIssuance
    ? {
        pricePerMochiKrw: data.mochiIssuance.pricePerMochiKrw,
        goalQuantity: data.mochiIssuance.goalQuantity,
        soldQuantity: data.mochiIssuance.soldQuantity,
        active: data.mochiIssuance.active,
      }
    : null;

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          {t("mochi.title")}
        </h1>
        <p className="mt-1.5 max-w-[560px] text-[15px] text-muted">
          {t("mochi.subtitle")}
        </p>
      </header>

      <MochiSettingsForm issuance={issuance} />
    </div>
  );
}

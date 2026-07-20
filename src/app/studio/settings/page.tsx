import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { SettingsForm, type ProfileValues } from "./SettingsForm";

/**
 * Studio settings — edit the public creator profile (identity/account fields are
 * managed elsewhere). Sits under the Studio layout (top bar + creator guard).
 */
export default async function StudioSettingsPage() {
  const creator = await getCurrentCreator();
  if (!creator) return null; // layout already redirects non-creators

  const t = await getTranslations("creatorDashboard");

  const initial: ProfileValues = {
    handle: creator.handle,
    displayName: creator.displayName,
    bio: creator.bio ?? "",
    creatorType: creator.creatorType ?? "",
    category: creator.category,
    chzzk: creator.chzzk ?? "",
    soop: creator.soop ?? "",
    youtube: creator.youtube ?? "",
    twitch: creator.twitch ?? "",
    discordUrl: creator.discordUrl ?? "",
    fanCafeUrl: creator.fanCafeUrl ?? "",
  };

  return (
    <div className="mx-auto max-w-[720px]">
      <Link
        href="/studio"
        className="text-[13px] font-semibold text-muted hover:text-ink"
      >
        ← {t("settings.back")}
      </Link>
      <h1 className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink">
        {t("settings.title")}
      </h1>
      <p className="mb-7 mt-1 text-[15px] text-muted">{t("settings.subtitle")}</p>

      <SettingsForm initial={initial} />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/Placeholder";
import { Mochi } from "@/components/Mochi";
import { formatCount } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/ranking";

/**
 * A creator's own supporter ranking — by lifetime mochi purchased, replacing
 * the old founding-number "Backer Wall" (DECISIONS 2026-08-01). Sits beside
 * `MarketplaceSection` in the profile page's 3:7 split, so rows stay compact:
 * rank badge, avatar, nickname, lifetime total — no message/founding-badge
 * cruft from the retired Phase-1 concept.
 */
export async function SupporterLeaderboard({
  entries,
  totalSupporters,
}: {
  entries: LeaderboardEntry[];
  totalSupporters: number;
}) {
  const t = await getTranslations("profile");

  return (
    <section>
      <h2 className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
        {t("leaderboardTitle")}
      </h2>
      <p className="mt-1 text-[13px] text-muted">
        {totalSupporters > 0
          ? t("leaderboardSubtitle", { count: totalSupporters })
          : t("leaderboardEmpty")}
      </p>

      {entries.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {entries.map((e) => (
            <li
              key={e.backerId}
              className="flex items-center gap-2.5 rounded-[12px] bg-panel px-3 py-2.5"
            >
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-coral-chip text-[11.5px] font-extrabold text-coral-deep">
                {e.rank}
              </span>
              <Avatar name={e.nickname} src={e.avatarUrl} size={30} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                {e.nickname}
              </span>
              <span className="flex flex-none items-center gap-1 text-[12.5px] font-bold text-ink">
                <Mochi width={12} height={9.5} />
                {formatCount(e.purchasedTotal)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

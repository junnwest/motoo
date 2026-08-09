import { getTranslations } from "next-intl/server";
import { Avatar } from "@/components/ui/Placeholder";
import { Mochi } from "@/components/Mochi";
import { formatCount } from "@/lib/format";
import type { LeaderboardEntry } from "@/lib/ranking";

/**
 * A creator's own supporter ranking — by lifetime mochi earned as a donation
 * bonus, replacing the old founding-number "Backer Wall" (DECISIONS
 * 2026-08-01). Sits beside
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
      <h2 className="text-xl font-extrabold tracking-[-0.02em] text-ink">
        {t("leaderboardTitle")}
      </h2>
      <p className="mt-1 text-xs text-muted">
        {totalSupporters > 0
          ? t("leaderboardSubtitle", { count: totalSupporters })
          : t("leaderboardEmpty")}
      </p>

      {entries.length > 0 && (
        // Rows were eleven identical tinted pills, so #1 carried exactly as
        // much weight as #10 and the whole point of a ranking was lost. The
        // fill is gone in favour of hairlines, which lets the top three carry
        // the emphasis instead: #1 gets the solid coral badge and a larger
        // avatar, #2 and #3 the tinted badge, everyone below a plain numeral.
        <ul className="mt-4 divide-y divide-line-2">
          {entries.map((e) => {
            const lead = e.rank === 1;
            return (
              <li key={e.backerId} className="flex items-center gap-2.5 py-2.5">
                <span
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-2xs font-extrabold ${
                    lead
                      ? "bg-coral text-white"
                      : e.rank <= 3
                        ? "bg-coral-chip text-coral-deep"
                        : "text-muted"
                  }`}
                >
                  {e.rank}
                </span>
                <Avatar
                  name={e.nickname}
                  src={e.avatarUrl}
                  size={lead ? 34 : 30}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-sm text-ink ${
                    lead ? "font-extrabold" : "font-semibold"
                  }`}
                >
                  {e.nickname}
                </span>
                <span className="flex flex-none items-center gap-1 text-xs font-bold text-ink">
                  <Mochi width={12} height={9.5} />
                  {formatCount(e.mochiEarnedTotal)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

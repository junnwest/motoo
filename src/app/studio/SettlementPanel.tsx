import { getTranslations } from "next-intl/server";
import { formatKrw } from "@/lib/format";
import { formatKstDate } from "@/lib/format";
import { Mochi } from "@/components/Mochi";
import type { SettlementSummary } from "@/lib/settlement";

function Figure({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex flex-col justify-center rounded-lg border border-line-2 bg-card p-5">
      <div
        className={`tracking-[-0.02em] text-ink ${strong ? "text-2xl font-extrabold" : "text-xl font-bold"}`}
      >
        {value}
      </div>
      <div className="mt-1 break-keep text-xs text-muted">{label}</div>
    </div>
  );
}

/**
 * The creator's money view (docs/PRELAUNCH.md #29).
 *
 * Reports what was *donated*, and says plainly that this is not the same as
 * what has been *paid out* — settlement timing belongs to the payment provider,
 * which is `mock` until 사업자등록. Overstating that would be the one mistake
 * worth avoiding here: a creator planning around a number motoo invented.
 *
 * Server component: it renders numbers and has nothing to interact with, so
 * there is no reason to ship it to the browser.
 */
export async function SettlementPanel({
  summary,
}: {
  summary: SettlementSummary;
}) {
  const t = await getTranslations("creatorDashboard.settlement");

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Figure
          label={t("thisMonth")}
          value={t("krw", { amount: summary.thisMonthKrw })}
          strong
        />
        <Figure
          label={t("lastMonth")}
          value={t("krw", { amount: summary.lastMonthKrw })}
        />
        <Figure
          label={t("total")}
          value={t("krw", { amount: summary.netKrw })}
        />
        <Figure
          label={t("refunded")}
          value={t("krw", { amount: summary.refundedKrw })}
        />
      </div>

      {/* The two caveats, both load-bearing. */}
      <p className="mt-4 break-keep border-l-2 border-line-2 pl-4 text-sm leading-relaxed text-muted">
        {t("notPayout")}
      </p>
      {summary.preLedgerKrw > 0 && (
        <p className="mt-2 break-keep border-l-2 border-line-2 pl-4 text-sm leading-relaxed text-muted">
          {t("preLedger", { amount: summary.preLedgerKrw })}
        </p>
      )}

      {summary.recent.length > 0 && (
        <>
          <h3 className="mt-8 text-sm font-bold text-ink">{t("recent")}</h3>
          <ul className="mt-2 flex flex-col">
            {summary.recent.map((d) => (
              <li
                key={d.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line-2 py-2.5 text-sm ${
                  d.refunded ? "opacity-55" : ""
                }`}
              >
                <span className="min-w-0 flex-1 truncate text-ink">
                  {d.supporter}
                </span>
                <span className="text-xs text-muted">
                  {formatKstDate(d.createdAt)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <Mochi width={13} height={10} className="text-coral-deep" />
                  {t("granted", { count: d.mochiGranted })}
                </span>
                <span className="font-bold text-ink">
                  {formatKrw(d.amountKrw)}
                </span>
                {d.refunded && (
                  <span className="rounded-full bg-panel px-2 py-0.5 text-2xs font-semibold text-muted">
                    {t("refundedBadge")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

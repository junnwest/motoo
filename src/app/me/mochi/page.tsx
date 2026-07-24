import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { getCurrentBacker } from "@/lib/session";
import { getHoldingsForBacker, getOrdersForBacker } from "@/lib/mochi";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

const ORDER_STATUS_CHIP: Record<string, string> = {
  pending: "bg-coral-chip text-coral-deep",
  fulfilled: "bg-sage-bg text-sage",
  cancelled: "bg-panel text-muted",
};

function formatKstDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")}`;
}

/**
 * "My mochi" — a user's mochi holdings across creators (per-creator balances).
 * Each holding links back to the creator's market to spend it.
 */
export default async function MyMochiPage() {
  const t = await getTranslations("myMochi");
  const tax = await getTranslations("creatorTaxonomy");
  const backer = await getCurrentBacker();

  if (!backer) {
    return (
      <>
        <Nav />
        <section className="mx-auto max-w-[900px] px-6 py-14">
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-4 flex items-end justify-center gap-1.5">
              <Mochi width={38} height={31} float />
              <Mochi width={50} height={41} float floatDelay={0.5} />
            </div>
            <p className="max-w-[360px] text-[16px] text-body">{t("empty")}</p>
            <ButtonLink
              href="/login"
              variant="primary"
              size="lg"
              className="mt-6"
            >
              {t("visit")}
            </ButtonLink>
          </div>
        </section>
        <Footer variant="fan" />
      </>
    );
  }

  const [holdings, orders] = await Promise.all([
    getHoldingsForBacker(backer.id),
    getOrdersForBacker(backer.id),
  ]);

  return (
    <>
      <Nav />

      <section className="mx-auto max-w-[900px] px-6 py-14">
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 text-[16px] text-body">{t("subtitle")}</p>

        <h2 className="mt-10 text-[20px] font-extrabold tracking-[-0.02em] text-ink">
          {t("holdingsTitle")}
        </h2>
        {holdings.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-[24px] border border-dashed border-line-3 bg-cream-warm/50 px-6 py-16 text-center">
            <div className="mb-3 flex items-end justify-center gap-1.5">
              <Mochi width={38} height={31} float />
              <Mochi width={50} height={41} float floatDelay={0.5} />
            </div>
            <p className="max-w-[360px] text-[15px] text-body">{t("empty")}</p>
            <ButtonLink
              href="/explore"
              variant="dark"
              size="md"
              className="mt-6"
            >
              {t("exploreCta")}
            </ButtonLink>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {holdings.map((h) => (
              <div
                key={h.id}
                className="flex flex-col rounded-[20px] border border-line-2 bg-card p-5"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    name={h.streamer.displayName}
                    src={h.streamer.avatarUrl}
                    size={44}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[16px] font-extrabold tracking-[-0.02em] text-ink">
                      {h.streamer.displayName}
                    </div>
                    <div className="truncate text-[13px] text-muted">
                      {ALL_CATEGORIES.includes(h.streamer.category)
                        ? tax(`categories.${h.streamer.category}`)
                        : h.streamer.category}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center rounded-[14px] bg-panel px-4 py-3">
                  <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
                    <Mochi width={16} height={12} />
                    {t("balance", { count: h.balance })}
                  </span>
                </div>

                <ButtonLink
                  href={`/s/${h.streamer.handle}`}
                  variant="secondary"
                  size="md"
                  className="mt-4 w-full"
                >
                  {t("visit")}
                </ButtonLink>
              </div>
            ))}
          </div>
        )}

        {/* Order / redemption history */}
        <h2 className="mt-14 text-[20px] font-extrabold tracking-[-0.02em] text-ink">
          {t("historyTitle")}
        </h2>
        <p className="mt-1 text-[14px] text-muted">{t("historySubtitle")}</p>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-[20px] border border-dashed border-line-3 bg-cream-warm/50 px-6 py-12 text-center text-[15px] text-muted">
            {t("historyEmpty")}
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[16px] border border-line-2 bg-card p-4"
              >
                <Avatar
                  name={o.streamer.displayName}
                  src={o.streamer.avatarUrl}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-ink">
                    {o.item.title}
                  </div>
                  <div className="truncate text-[13px] text-muted">
                    {o.streamer.displayName} · {formatKstDate(o.createdAt)}
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-[14px] font-extrabold text-ink">
                  <Mochi width={15} height={11} />
                  {t("spent", { count: o.mochiSpent })}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                    ORDER_STATUS_CHIP[o.status] ?? "bg-panel text-muted"
                  }`}
                >
                  {t(`orderStatus.${o.status}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Footer variant="fan" />
    </>
  );
}

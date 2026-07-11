import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { getCurrentBacker } from "@/lib/session";
import { getHoldingsForBacker } from "@/lib/mochi";

/**
 * "My mochi" — a user's mochi holdings across creators (per-creator balances).
 * Each holding links back to the creator's market to spend it.
 */
export default async function MyMochiPage() {
  const t = await getTranslations("myMochi");
  const backer = await getCurrentBacker();

  if (!backer) {
    return (
      <>
        <Nav variant="fan" />
        <section className="mx-auto max-w-[900px] px-6 py-14">
          <div className="flex flex-col items-center py-20 text-center">
            <div className="mb-4 text-[40px]">🍡</div>
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

  const holdings = await getHoldingsForBacker(backer.id);

  return (
    <>
      <Nav variant="fan" />

      <section className="mx-auto max-w-[900px] px-6 py-14">
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em] text-ink sm:text-[40px]">
          {t("title")}
        </h1>
        <p className="mt-2 text-[16px] text-body">{t("subtitle")}</p>

        {holdings.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-[24px] border border-dashed border-line-3 bg-cream-warm/50 px-6 py-20 text-center">
            <div className="mb-3 text-[40px]">🍡</div>
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
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      {h.streamer.category}
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
      </section>

      <Footer variant="fan" />
    </>
  );
}

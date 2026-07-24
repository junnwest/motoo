import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { BackingFlow } from "@/components/BackingFlow";
import { getStreamerForBacking } from "@/lib/streamers";
import { getCurrentBacker } from "@/lib/session";
import { previewFoundingNumber } from "@/lib/backing";
import { COOKIE_PACKS, MOCHI_TO_KRW } from "@/lib/payments/types";

export default async function BackPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tier?: string }>;
}) {
  const { handle } = await params;
  const { tier } = await searchParams;
  const t = await getTranslations("profile");

  const streamer = await getStreamerForBacking(handle);
  if (!streamer || streamer.status !== "approved") {
    return (
      <>
        <Nav />
        <section className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-32 text-center">
          <div className="mb-4 text-[48px]">🔍</div>
          <h1 className="text-[26px] font-extrabold">{t("notFoundTitle")}</h1>
          <p className="mt-3 text-[16px] text-body">{t("notFoundBody")}</p>
          <Link
            href="/explore"
            className="mt-8 rounded-[12px] bg-ink px-5 py-3 text-[14px] font-bold text-cream"
          >
            {t("backToExplore")}
          </Link>
        </section>
      </>
    );
  }

  const backer = await getCurrentBacker();
  const founding = await previewFoundingNumber(streamer.id, backer?.id ?? null);

  return (
    <>
      <Nav />
      <BackingFlow
        handle={handle}
        streamerName={`@${streamer.displayName}`}
        tiers={streamer.tiers.map((tr) => ({
          id: tr.id,
          name: tr.name,
          priceKrw: tr.priceKrw,
          description: tr.description,
          perks: tr.perks.map((p) => ({ id: p.id, title: p.title })),
        }))}
        initialBalance={backer?.currencyBalance ?? 0}
        preselectedTierId={tier}
        founding={founding}
        backerAgeVerified={backer?.ageVerified ?? false}
        backerNickname={backer?.nickname ?? ""}
        mochiToKrw={MOCHI_TO_KRW}
        packs={COOKIE_PACKS}
      />
    </>
  );
}

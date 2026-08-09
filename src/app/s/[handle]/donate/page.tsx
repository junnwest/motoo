import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Avatar } from "@/components/ui/Placeholder";
import { IconChevronLeft, IconSearch } from "@/components/ui/Icons";
import { DonateMochi } from "@/components/DonateMochi";
import { getStreamerMarketplace } from "@/lib/streamers";
import { getCurrentBacker } from "@/lib/session";
import { getHolding } from "@/lib/mochi";
import { isFollowing } from "@/lib/follows";

/**
 * The focused donate flow — its own page, not a section of the profile
 * (DECISIONS 2026-08-01): the hero's 모찌 보내기 button used to jump to an
 * in-page anchor; now it routes here. Skips ConsumerShell on purpose, same as
 * the retired `/back` flow it replaces — a donation flow doesn't need the
 * Sidebar/RightRail chrome, just a way back to the profile. Mochi is never
 * sold here (see docs/DECISIONS.md, the donation-pivot entry): the fan's KRW
 * goes straight to the creator, and mochi is granted afterward as a bonus.
 */
export default async function DonateMochiPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const t = await getTranslations("donate");
  const tp = await getTranslations("profile");

  const streamer = await getStreamerMarketplace(handle);

  if (!streamer) {
    return (
      <>
        <Nav />
        <section className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-32 text-center">
          <IconSearch width={44} height={44} className="mb-4 text-muted" />
          <h1 className="text-2xl font-extrabold">{tp("notFoundTitle")}</h1>
          <p className="mt-3 text-base text-body">{tp("notFoundBody")}</p>
          <Link
            href="/explore"
            className="mt-8 rounded-md bg-ink px-5 py-3 text-sm font-bold text-cream"
          >
            {tp("backToExplore")}
          </Link>
        </section>
      </>
    );
  }

  const backer = await getCurrentBacker();
  const [holding, following] = await Promise.all([
    backer ? getHolding(streamer.id, backer.id) : null,
    backer ? isFollowing(streamer.id, backer.id) : false,
  ]);
  const balance = holding?.balance ?? 0;
  const issuance = streamer.mochiIssuance
    ? {
        pricePerMochiKrw: streamer.mochiIssuance.pricePerMochiKrw,
        goalQuantity: streamer.mochiIssuance.goalQuantity,
        grantedQuantity: streamer.mochiIssuance.grantedQuantity,
        active: streamer.mochiIssuance.active,
      }
    : null;

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto max-w-[480px] px-6 py-14 sm:py-20">
        <Link
          href={`/s/${handle}`}
          className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink"
        >
          <IconChevronLeft width={16} height={16} />
          {t("backToProfile")}
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <Avatar
            name={streamer.displayName}
            src={streamer.avatarUrl}
            size={44}
          />
          <div className="text-base font-extrabold text-ink">
            {streamer.displayName}
          </div>
        </div>

        <div className="mt-6">
          <DonateMochi
            handle={handle}
            streamerId={streamer.id}
            creatorName={streamer.displayName}
            issuance={issuance}
            balance={balance}
            loggedIn={!!backer}
            following={following}
          />
        </div>
      </main>
    </>
  );
}

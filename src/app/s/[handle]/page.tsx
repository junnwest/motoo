import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { IconLock } from "@/components/ui/Icons";
import { CreatorFacet } from "@/components/CreatorFacet";
import { SupporterLeaderboard } from "@/components/SupporterLeaderboard";
import { MarketplaceSection } from "@/components/MarketplaceSection";
import { FollowButton } from "@/components/FollowButton";
import { ReportButton } from "@/components/ReportButton";
import { HideCreatorButton } from "@/components/HideCreatorButton";
import { getStreamerProfile } from "@/lib/streamers";
import { getCurrentBacker } from "@/lib/session";
import { getHolding } from "@/lib/mochi";
import { isFollowing } from "@/lib/follows";
import { getSupporterLeaderboard } from "@/lib/ranking";
import { getHiddenStreamerIds } from "@/lib/blocks";
import { formatCount } from "@/lib/format";
import { isCreatorType, ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/**
 * Per-creator metadata. This page is the product's main shareable object — a
 * creator posting their link is the primary organic growth path — and until now
 * it inherited the root layout's single (and retired) title/description, with
 * no image. Every share looked identical and described the wrong product.
 *
 * Unknown handles return empty metadata rather than guessing: the page itself
 * calls notFound(), and titling a 404 after the handle someone mistyped would
 * put that string in the tab and in any preview card.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const [t, data] = await Promise.all([
    getTranslations("meta"),
    getStreamerProfile(handle),
  ]);
  if (!data) return {};

  const { streamer } = data;
  // Default limit on purpose, matching the page's own call below: both are
  // `cache()`d, so identical arguments collapse into one set of queries per
  // request. Passing `1` here to "save" rows would defeat that and double the
  // leaderboard work for a number the page fetches anyway.
  const { totalSupporters } = await getSupporterLeaderboard(streamer.id);
  const title = t("creator.title", {
    name: streamer.displayName,
    handle: streamer.handle,
  });
  const description =
    totalSupporters > 0
      ? t("creator.description", {
          name: streamer.displayName,
          supporters: totalSupporters,
        })
      : t("creator.descriptionNoSupporters", { name: streamer.displayName });
  const url = `/s/${streamer.handle}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      title,
      description,
      // The sibling opengraph-image.tsx renders this per creator; Next wires it
      // up automatically, so only the URL fields need stating here.
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StreamerProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const t = await getTranslations("profile");
  const tc = await getTranslations("common");
  const tax = await getTranslations("creatorTaxonomy");
  // Independent reads run concurrently (the viewer's account doesn't depend on
  // the profile). Issuance + items are folded into the profile query itself.
  const [data, backer] = await Promise.all([
    getStreamerProfile(handle),
    getCurrentBacker(),
  ]);

  // A real 404, not a 200 with "not found" in the body. The inline version this
  // replaces meant every typo'd or deleted handle was indexable as a live page
  // and indistinguishable from a success in any monitoring. The copy moved
  // verbatim to ./not-found.tsx, which Next renders with the right status.
  if (!data) notFound();

  const { streamer, updates } = data;

  // Phase 2: mochi issuance + marketplace (from the profile query) + the
  // viewer's holding balance (depends on both the streamer and the account) +
  // the supporter leaderboard (also live-computed, DECISIONS 2026-08-01).
  const [holding, following, leaderboard, hiddenIds] = await Promise.all([
    backer ? getHolding(streamer.id, backer.id) : null,
    backer ? isFollowing(streamer.id, backer.id) : false,
    getSupporterLeaderboard(streamer.id),
    backer ? getHiddenStreamerIds(backer.id) : ([] as string[]),
  ]);
  // A hidden creator's page stays reachable by direct link — hiding is about
  // what gets pushed at you, not a wall. The control just shows its undo.
  const hidden = hiddenIds.includes(streamer.id);
  const balance = holding?.balance ?? 0;
  // Has this viewer ever earned this creator's mochi? Gates supporter-only posts.
  const isSupporter = (holding?.mochiEarnedTotal ?? 0) > 0;
  const items = streamer.marketplaceItems.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    priceMochi: i.priceMochi,
    itemType: i.itemType,
    thumbnailKey: i.thumbnailKey,
    coverImage: i.coverImage,
    fulfillment: i.fulfillment,
    fulfillmentDays: i.fulfillmentDays,
    stock: i.stock,
    redeemedCount: i.redeemedCount,
  }));

  const platformLinks = [
    { label: "CHZZK", href: streamer.chzzk },
    { label: "SOOP", href: streamer.soop },
    { label: "YouTube", href: streamer.youtube },
    { label: "Twitch", href: streamer.twitch },
    { label: "Discord", href: streamer.discordUrl },
  ].filter((l) => l.href);

  const headlineStats = [
    { value: `${leaderboard.totalSupporters}`, label: t("backers") },
    {
      value: formatCount(leaderboard.totalMochiEarned),
      label: t("totalMochi"),
    },
  ];

  return (
    <>
      <ConsumerShell>
      {/* Header. Unlike the other ConsumerShell pages, this one is NOT capped
          at 900px (DECISIONS 2026-08-01): the rails already narrow the middle
          column, and a second cap inside them left the market grid stranded in
          whitespace. The page fills its column and boxes each section instead. */}
      <section className="border-b border-line bg-cream-warm px-6 py-10 sm:px-7">
        {/* Two columns at desktop: identity left, actions + stats right. As one
            row with the CTA pinned right, the band left a dead gap the width of
            half the screen between the bio and the buttons — the stats were
            stranded below it, reading as two empty banners. Pairing the numbers
            with the actions closes the gap and gives the band a right edge. */}
        <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar name={streamer.displayName} size={76} src={streamer.avatarUrl} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
                {streamer.displayName}
              </h1>
              <span className="text-sm text-muted">@{streamer.handle}</span>
            </div>
            <CreatorFacet
              variant="chips"
              className="mt-2.5"
              typeLabel={
                streamer.creatorType && isCreatorType(streamer.creatorType)
                  ? tax(`types.${streamer.creatorType}`)
                  : null
              }
              categoryLabel={
                ALL_CATEGORIES.includes(streamer.category)
                  ? tax(`categories.${streamer.category}`)
                  : streamer.category
              }
            />
            {streamer.bio && (
              <p className="mt-2 max-w-[560px] text-base leading-relaxed text-body">
                {streamer.bio}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {platformLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-line-3 bg-white px-3 py-[5px] text-xs font-medium text-muted-2 hover:border-coral/50"
                >
                  {l.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-none flex-col gap-5 lg:items-end">
          <div className="flex gap-2.5">
            <FollowButton
              streamerId={streamer.id}
              handle={streamer.handle}
              initialFollowing={following}
              signedIn={!!backer}
            />
            <ButtonLink href={`/s/${streamer.handle}/donate`} size="lg">
              <Mochi width={18} height={14} className="text-coral-deep" /> {tc("donate")}
            </ButtonLink>
          </div>

          {/* Stats sit on the band, not in bordered boxes on top of it: a
              border inside a tinted section reads as a card that lost its
              page. Translucent white keeps the warm tone showing through. */}
          <div className="grid w-full grid-cols-2 gap-3 lg:w-auto">
            {headlineStats.map((s) => (
              <div
                key={s.label}
                className="rounded-lg bg-white/70 px-5 py-3 text-center lg:min-w-[116px]"
              >
                <div className="text-xl font-extrabold tracking-[-0.02em]">
                  {s.value}
                </div>
                <div className="mt-0.5 text-xs text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quiet, and last. Reporting is rare and sits next to a page whose
              main action moves money — a prominent control here would collect
              mis-taps, not reports. */}
          <div className="flex items-center gap-1 lg:justify-end lg:text-right">
            <HideCreatorButton
              streamerId={streamer.id}
              creatorName={streamer.displayName}
              hidden={hidden}
              signedIn={!!backer}
            />
            <ReportButton
              targetType="creator"
              targetId={streamer.id}
              signedIn={!!backer}
            />
          </div>
        </div>
        </div>
      </section>

      {/* Each section is its own bordered panel so the page reads as distinct
          blocks rather than one continuous scroll (DECISIONS 2026-08-01). The
          three panels used to be byte-identical — same border, same radius,
          same white — so nothing said which one mattered. They now carry three
          weights: the market is raised (white + shadow), the leaderboard is
          recessed (panel tint, no shadow) because it's context for the market
          rather than a peer of it, and updates stay flat. Same system, three
          depths; no section was de-boxed. */}
      <div className="flex w-full flex-col gap-6 px-6 py-8 sm:px-7 sm:py-10">
        {/* Ranking (30%) + Marketplace (70%), side by side (DECISIONS
            2026-08-01) — 후원하기 now routes to its own page
            (/s/[handle]/donate) instead of an in-page anchor, freeing this
            column for the supporter leaderboard next to the market instead of
            stacked above it. Stacks to one column on narrow viewports. */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <div className="rounded-xl border border-line-2 bg-panel p-6 lg:col-span-3">
            <SupporterLeaderboard
              entries={leaderboard.entries}
              totalSupporters={leaderboard.totalSupporters}
            />
          </div>
          <div className="rounded-xl border border-line-2 bg-card p-6 shadow-card lg:col-span-7">
            <MarketplaceSection
              handle={streamer.handle}
              balance={balance}
              loggedIn={!!backer}
              items={items}
            />
          </div>
        </div>

        {/* Updates */}
        <div className="rounded-xl border border-line-2 bg-card p-6">
          <h2 className="mb-4 text-xl font-extrabold tracking-[-0.02em]">
            {t("updatesTitle")}
          </h2>
          {updates.length === 0 ? (
            <p className="text-sm text-body">{t("updatesEmpty")}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {updates.map((u) => {
                // A backers-only post is locked for everyone *except* someone
                // who actually holds this creator's mochi. It used to be
                // locked unconditionally, so the people it was written for
                // could never read it — which made "팬 전용" a label with no
                // payoff. `mochiEarnedTotal`, not `balance`: spending your
                // mochi shouldn't revoke access your donation earned.
                const locked = u.visibility !== "public" && !isSupporter;
                return (
                  <li
                    key={u.id}
                    className="rounded-lg border border-line-2 bg-panel p-4"
                  >
                    {locked ? (
                      <>
                        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                          <IconLock width={14} height={14} />
                          {t("backerOnly")}
                        </div>
                        <p className="mt-1 text-sm text-body">
                          {t("backerOnlyBody")}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-base font-bold">{u.title}</div>
                        <p className="mt-1 line-clamp-2 text-sm leading-normal text-body">
                          {u.body}
                        </p>
                        {/* Posts became reportable once they became takeable-
                            down: a target an admin can act on and nobody can
                            flag is a lever with no handle. Not offered on a
                            locked post — reporting something you cannot read
                            is not a judgement anyone can make. */}
                        <div className="-mb-1 mt-1 flex justify-end">
                          <ReportButton
                            targetType="update"
                            targetId={u.id}
                            signedIn={!!backer}
                          />
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      </ConsumerShell>
    </>
  );
}

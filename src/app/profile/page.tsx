import type { Metadata } from "next";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { CreatorBadge } from "@/components/CreatorBadge";
import { CancelOrderButton } from "@/components/CancelOrderButton";
import { CreatorCover } from "@/components/CreatorCover";
import { Section } from "@/components/ui/Section";
import { getCurrentBacker, getSession } from "@/lib/session";
import { getHoldingsForBacker, getOrdersForBacker } from "@/lib/mochi";
import { formatKstDate } from "@/lib/format";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

const ORDER_STATUS_CHIP: Record<string, string> = {
  pending: "bg-coral-chip text-coral-deep",
  fulfilled: "bg-sage-bg text-sage",
  cancelled: "bg-panel text-muted",
};

/**
 * The signed-in user's own profile (DECISIONS 2026-07-30): identity header +
 * everything that used to live at /me/mochi (holdings, order history), now
 * reached from the avatar dropdown instead of a standalone nav link. /me/mochi
 * redirects here.
 */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const t = await getTranslations("myProfile");
  const tc = await getTranslations("common");
  const tm = await getTranslations("myMochi");
  const tax = await getTranslations("creatorTaxonomy");
  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset");

  const [holdings, orders] = await Promise.all([
    getHoldingsForBacker(backer.id),
    getOrdersForBacker(backer.id),
  ]);

  return (
    <>
      <ConsumerShell>
        <div className="mx-auto max-w-[900px] px-6 py-12 sm:px-10 sm:py-16">
          {/* Identity. Accounts are additive, so owning a Studio is the only
              thing that distinguishes a creator — surfaced here (and in the nav
              dropdown) rather than left implicit. */}
          <div className="flex flex-wrap items-center gap-5">
            <Avatar name={backer.nickname} src={backer.avatarUrl} size={72} />
            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
                {backer.nickname}
              </h1>
              {backer.handle && (
                <p className="text-sm text-muted">@{backer.handle}</p>
              )}
              {session.user.creator && (
                <CreatorBadge
                  label={tc("creatorRegistered")}
                  className="mt-2"
                />
              )}
            </div>
            <ButtonLink href="/settings" variant="secondary" size="md">
              {t("editProfile")}
            </ButtonLink>
          </div>

          {/* Holdings */}
          <Section title={tm("holdingsTitle")} className="mt-10">
            {holdings.length === 0 ? (
              <div className="flex flex-col items-center rounded-lg border border-dashed border-line-3 bg-card/60 px-6 py-16 text-center">
                <div className="mb-3 flex items-end justify-center gap-1.5">
                  <Mochi width={38} height={31} float />
                  <Mochi width={50} height={41} float floatDelay={0.5} />
                </div>
                <p className="max-w-[360px] text-base text-body">
                  {tm("empty")}
                </p>
                <ButtonLink
                  href="/explore"
                  variant="dark"
                  size="md"
                  className="mt-6"
                >
                  {tm("exploreCta")}
                </ButtonLink>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {holdings.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-col rounded-lg bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <CreatorCover
                        handle={h.streamer.handle}
                        displayName={h.streamer.displayName}
                        className="h-11 w-11 flex-none rounded-full"
                        markClass="text-lg"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-base font-extrabold tracking-[-0.02em] text-ink">
                          {h.streamer.displayName}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {ALL_CATEGORIES.includes(h.streamer.category)
                            ? tax(`categories.${h.streamer.category}`)
                            : h.streamer.category}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center rounded-md bg-panel px-4 py-3">
                      <span className="flex items-center gap-1.5 text-base font-extrabold text-ink">
                        <Mochi width={16} height={12} />
                        {tm("balance", { count: h.balance })}
                      </span>
                    </div>

                    <ButtonLink
                      href={`/s/${h.streamer.handle}`}
                      variant="secondary"
                      size="md"
                      className="mt-4 w-full"
                    >
                      {tm("visit")}
                    </ButtonLink>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Order / redemption history */}
          <Section title={tm("historyTitle")} className="mt-6">
            <p className="-mt-2 mb-4 text-sm text-muted">
              {tm("historySubtitle")}
            </p>
            {orders.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line-3 bg-card/60 px-6 py-12 text-center text-base text-muted">
                {tm("historyEmpty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card p-4 shadow-soft"
                  >
                    <Avatar
                      name={o.streamer.displayName}
                      src={o.streamer.avatarUrl}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold text-ink">
                        {o.item.title}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {o.streamer.displayName} · {formatKstDate(o.createdAt)}
                      </div>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm font-extrabold text-ink">
                      <Mochi width={15} height={11} />
                      {tm("spent", { count: o.mochiSpent })}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-2xs font-semibold ${
                        ORDER_STATUS_CHIP[o.status] ?? "bg-panel text-muted"
                      }`}
                    >
                      {tm(`orderStatus.${o.status}` as never)}
                    </span>
                    {/* Only a pending order can be taken back — a fulfilled one
                        has already cost the creator the work. */}
                    {o.status === "pending" && (
                      <CancelOrderButton
                        orderId={o.id}
                        itemTitle={o.item.title}
                        mochiSpent={o.mochiSpent}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </ConsumerShell>
      <Footer variant="fan" />
    </>
  );
}

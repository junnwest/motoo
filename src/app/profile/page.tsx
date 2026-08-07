import type { Metadata } from "next";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Mochi } from "@/components/Mochi";
import { Avatar } from "@/components/ui/Placeholder";
import { CreatorBadge } from "@/components/CreatorBadge";
import { CreatorCover } from "@/components/CreatorCover";
import { Section } from "@/components/ui/Section";
import { getCurrentBacker } from "@/lib/session";
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
  const session = await auth();
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
              <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink sm:text-[34px]">
                {backer.nickname}
              </h1>
              {backer.handle && (
                <p className="text-[14px] text-muted">@{backer.handle}</p>
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
              <div className="flex flex-col items-center rounded-[16px] border border-dashed border-line-3 bg-card/60 px-6 py-16 text-center">
                <div className="mb-3 flex items-end justify-center gap-1.5">
                  <Mochi width={38} height={31} float />
                  <Mochi width={50} height={41} float floatDelay={0.5} />
                </div>
                <p className="max-w-[360px] text-[15px] text-body">
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
                    className="flex flex-col rounded-[16px] bg-card p-5 shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <CreatorCover
                        handle={h.streamer.handle}
                        displayName={h.streamer.displayName}
                        className="h-11 w-11 flex-none rounded-full"
                        markClass="text-[17px]"
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

                    <div className="mt-4 flex items-center rounded-[12px] bg-panel px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[15px] font-extrabold text-ink">
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
            <p className="-mt-2 mb-4 text-[14px] text-muted">
              {tm("historySubtitle")}
            </p>
            {orders.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-line-3 bg-card/60 px-6 py-12 text-center text-[15px] text-muted">
                {tm("historyEmpty")}
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] bg-card p-4 shadow-soft"
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
                      {tm("spent", { count: o.mochiSpent })}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                        ORDER_STATUS_CHIP[o.status] ?? "bg-panel text-muted"
                      }`}
                    >
                      {tm(`orderStatus.${o.status}` as never)}
                    </span>
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

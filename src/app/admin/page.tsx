import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { NOINDEX } from "@/lib/metadata";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";
import { CreatorRow } from "./CreatorRow";

export const metadata: Metadata = { robots: NOINDEX };

/**
 * The minimal admin console (docs/PRELAUNCH.md #14). Before this the only lever
 * over a bad actor was a SQL client pointed at production.
 *
 * Deliberately small: creators, their status, and suspend/restore. It is not a
 * dashboard, and resisting the urge to make it one is what keeps it shippable —
 * every other moderation surface (items, updates, users) can be added when
 * there is a real case for it rather than a hypothetical one.
 *
 * `force-dynamic` because an admin list served from cache is a list that lies
 * about who is currently suspended.
 */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin(); // 404s for everyone else
  const t = await getTranslations("admin");

  const creators = await prisma.streamer.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
    select: {
      id: true,
      handle: true,
      displayName: true,
      status: true,
      suspendedReason: true,
      suspendedBy: true,
      _count: { select: { mochiHoldings: true } },
    },
  });

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[860px] flex-1 px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 text-base text-body break-keep">{t("subtitle")}</p>

        <div className="mt-8">
          {creators.map((c) => (
            <CreatorRow
              key={c.id}
              streamerId={c.id}
              handle={c.handle}
              displayName={c.displayName}
              status={c.status}
              supporters={c._count.mochiHoldings}
              suspendedReason={c.suspendedReason}
              suspendedBy={c.suspendedBy}
            />
          ))}
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}

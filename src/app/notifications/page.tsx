import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { NotificationList } from "./NotificationList";
import { getNotificationPage } from "@/lib/notify";
import { Pager } from "@/components/Pager";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

/** Full notification history — the page the bell's "전체 보기" hands off to. */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const t = await getTranslations("notifications");
  const sp = await searchParams;
  const page = Math.max(0, (Number(sp.page) || 1) - 1);
  // Paged rather than capped at 60: older notices used to be unreachable, which
  // included the money-adjacent ones (a creator raising their rate).
  const { rows, hasMore } = await getNotificationPage(session.user.id!, page);
  const hasUnread = rows.some((r) => !r.read);

  return (
    <>
      <ConsumerShell>
      <div className="w-full px-6 py-10 sm:px-8 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            {t("title")}
          </h1>
        </div>
        <p className="mt-2 text-base text-body">{t("subtitle")}</p>

        <NotificationList
          initialRows={rows.map((r) => ({
            id: r.id,
            title: r.title,
            body: r.body,
            link: r.link,
            read: r.read,
            createdAt: r.createdAt.toISOString(),
          }))}
          hasUnread={hasUnread}
          markAllLabel={t("markAllRead")}
          emptyLabel={t("empty")}
        />

        <Pager
          basePath="/notifications"
          searchParams={sp}
          page={page}
          hasMore={hasMore}
        />
      </div>
      </ConsumerShell>

    </>
  );
}

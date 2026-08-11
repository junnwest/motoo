import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { NotificationList } from "./NotificationList";
import { getNotificationsForBacker } from "@/lib/notify";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

/** Full notification history — the page the bell's "전체 보기" hands off to. */
export default async function NotificationsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const t = await getTranslations("notifications");
  const rows = await getNotificationsForBacker(session.user.id!, 60);
  const hasUnread = rows.some((r) => !r.read);

  return (
    <>
      <ConsumerShell>
      <div className="mx-auto max-w-[900px] px-6 py-12 sm:px-10 sm:py-16">
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
      </div>
      </ConsumerShell>
    </>
  );
}

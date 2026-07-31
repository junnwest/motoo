import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { NotificationList } from "./NotificationList";
import { getNotificationsForBacker } from "@/lib/notify";

/** Full notification history — the page the bell's "전체 보기" hands off to. */
export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const t = await getTranslations("notifications");
  const rows = await getNotificationsForBacker(session.user.id!, 60);
  const hasUnread = rows.some((r) => !r.read);

  return (
    <>
      <ConsumerShell>
      <main className="mx-auto max-w-[900px] px-6 py-12 sm:px-10 sm:py-16">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink sm:text-[34px]">
            {t("title")}
          </h1>
        </div>
        <p className="mt-2 text-[15.5px] text-body">{t("subtitle")}</p>

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
      </main>
      </ConsumerShell>
      <Footer variant="fan" />
    </>
  );
}

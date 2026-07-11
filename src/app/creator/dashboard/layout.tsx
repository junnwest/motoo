import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";
import { DashboardNav } from "./DashboardNav";

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/creator/onboarding");

  const t = await getTranslations("creatorDashboard");

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-[20px] font-extrabold tracking-[-0.02em] text-ink"
            >
              motoo
            </Link>
            <span className="text-[15px] font-semibold text-muted">
              {creator.displayName}
            </span>
          </div>
          <Link
            href={`/s/${creator.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold text-coral-deep hover:underline"
          >
            {t("viewPublic")}
          </Link>
        </div>
      </header>

      {/* Two-column body */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-6 py-10 md:grid-cols-[200px_1fr]">
        <aside className="md:sticky md:top-10 md:self-start">
          <DashboardNav
            labels={{
              home: t("navHome"),
              mochi: t("navMochi"),
              items: t("navItems"),
              orders: t("navOrders"),
            }}
          />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

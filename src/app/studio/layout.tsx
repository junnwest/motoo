import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentCreator } from "@/lib/session";

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Studio is for accounts that own a Studio (Streamer). A signed-in user who
  // isn't a creator yet is routed into the become-a-creator flow.
  const creator = await getCurrentCreator();
  if (!creator) redirect("/api/become-creator");

  const t = await getTranslations("creatorDashboard");

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-4 px-6 py-4 lg:px-10">
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

      {/* Single-view body — no sidebar; the dashboard is one scroll. */}
      <div className="mx-auto max-w-[1680px] px-6 py-10 lg:px-10">
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

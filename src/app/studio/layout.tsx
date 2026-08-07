import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
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

  return (
    <div className="min-h-screen bg-cream">
      {/* Unified nav (brand + avatar dropdown) — same bar as the consumer app;
          on the studio host the dropdown surfaces console actions. */}
      <Nav />

      {/* Single-view body — no sidebar; the dashboard is one scroll. */}
      <div className="mx-auto max-w-[1680px] px-6 py-10 lg:px-10">
        <main id="main" className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

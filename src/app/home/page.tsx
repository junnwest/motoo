import type { Metadata } from "next";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { HomeSignedIn } from "@/components/HomeSignedIn";
import { getCurrentBacker, getSession } from "@/lib/session";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

/**
 * `/home` — the app home for signed-in users. `/` stays the marketing landing
 * and redirects signed-in visitors here; `/explore` stays the dedicated browse
 * page. One URL per job. See DECISIONS 2026-07-29, restructured 2026-07-30
 * (persistent Sidebar via ConsumerShell; HomeSignedIn now owns only the
 * mochi-status + suggestion columns).
 *
 * Signed-out visitors get the marketing landing instead of a login wall — there
 * is nothing here to see without an account, and `/` is the right pitch.
 */
export default async function HomePage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset"); // stale cookie → self-heal

  return (
    <>
      <ConsumerShell>
        <HomeSignedIn backerId={backer.id} nickname={backer.nickname} />
      </ConsumerShell>
      <Footer variant="fan" />
    </>
  );
}

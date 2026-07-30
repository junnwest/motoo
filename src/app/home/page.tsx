import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HomeSignedIn } from "@/components/HomeSignedIn";
import { getCurrentBacker } from "@/lib/session";

/**
 * `/home` — the app home for signed-in users (balances → pending orders → news
 * → a discovery strip). `/` stays the marketing landing and redirects signed-in
 * visitors here; `/explore` stays the dedicated browse page. One URL per job.
 * See DECISIONS 2026-07-29.
 *
 * Signed-out visitors get the marketing landing instead of a login wall — there
 * is nothing here to see without an account, and `/` is the right pitch.
 */
export default async function HomePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset"); // stale cookie → self-heal

  return <HomeSignedIn backerId={backer.id} nickname={backer.nickname} />;
}

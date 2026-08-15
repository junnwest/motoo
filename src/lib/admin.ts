import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

/**
 * Admin access.
 *
 * `Role.admin` already existed in the schema and nothing used it. Using it
 * beats an env allowlist here for one reason: the check is a database read on
 * the current session's account, so revoking someone takes effect on their next
 * request rather than on the next deploy.
 *
 * **There is deliberately no UI to grant it.** Promotion is a manual `UPDATE
 * "Backer" SET role = 'admin'` by someone with database access, which means
 * privilege escalation has no in-product path to attack. If that ever becomes
 * inconvenient, it is still the right default for a product that can move
 * money.
 */
export async function getAdmin(): Promise<{ id: string; email: string } | null> {
  const session = await getSession();
  const id = session?.user?.id;
  if (!id) return null;

  const backer = await prisma.backer.findUnique({
    where: { id },
    select: { id: true, email: true, role: true },
  });
  if (!backer || backer.role !== "admin") return null;
  return { id: backer.id, email: backer.email };
}

/**
 * Guard for admin pages and actions. **404, not 403** — a 403 confirms the
 * route exists, and an admin console nobody should know about is better off
 * indistinguishable from a typo.
 */
export async function requireAdmin(): Promise<{ id: string; email: string }> {
  const admin = await getAdmin();
  if (!admin) notFound();
  return admin;
}

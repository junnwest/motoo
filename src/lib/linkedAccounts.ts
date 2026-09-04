import { Prisma, type LinkedAccountProvider } from "@prisma/client";
import { prisma } from "@/lib/db";

export type LinkResult =
  | { ok: true }
  | { ok: false; error: "linkedElsewhere" | "emailTaken" | "generic" };

/**
 * Attach an OAuth identity to a Backer, called from the link callback route
 * once the provider's profile has been fetched.
 *
 * Deliberately independent of `auth.ts`'s ordinary sign-in resolution, which
 * stays exclusively email-based — see the module note on `LinkedAccount` in
 * prisma/schema.prisma. That's why linking an email already owned by a
 * *different* Backer is rejected below: allowing it would let this table and
 * the unchanged email-match login path disagree about who that identity
 * belongs to, depending on which door someone walks through.
 */
export async function linkAccount(
  backerId: string,
  provider: LinkedAccountProvider,
  providerAccountId: string,
  email: string | null,
): Promise<LinkResult> {
  const existing = await prisma.linkedAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
  });
  if (existing) {
    // Relinking the same identity is a no-op — deliberately does not refresh
    // `email`/`linkedAt`, same "recorded once, not kept in sync" posture as
    // Backer.emailVerifiedAt.
    if (existing.backerId === backerId) return { ok: true };
    return { ok: false, error: "linkedElsewhere" };
  }

  if (email) {
    const emailOwner = await prisma.backer.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    // Exempt when it's the caller's own current address — linking your own
    // email is exactly the common case "any email allowed" is meant to cover.
    if (emailOwner && emailOwner.id !== backerId) {
      return { ok: false, error: "emailTaken" };
    }
  }

  try {
    await prisma.linkedAccount.create({
      data: { backerId, provider, providerAccountId, email },
    });
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // This backer already has a different identity of this provider linked
      // (the @@unique([backerId, provider]) guard) — surfaced generically;
      // the UI's per-provider row already reflects the existing link.
      return { ok: false, error: "generic" };
    }
    throw e;
  }
}

export type UnlinkResult = { ok: true } | { ok: false; error: "notFound" | "lockout" };

/**
 * Takes an explicit `backerId` rather than reading the session, so it's the
 * same shape as `linkAccount` above and directly testable — the session read
 * and rate limit live in the thin wrapper,
 * `src/app/settings/linked-accounts-actions.ts`'s `unlinkAccountAction`.
 *
 * Refuses to strand the account: if this would leave no password and no
 * other linked provider, the account becomes permanently unreachable.
 *
 * The lockout check and the delete run inside one transaction, with the
 * Backer row locked (`FOR UPDATE`) for its duration — otherwise two
 * concurrent unlinks on a passwordless account with exactly two linked
 * providers can each read "one other link remains" before either commits,
 * both pass the check, and both delete, leaving zero sign-in methods. The
 * lock serializes them: the second waits for the first's transaction to
 * finish, then re-reads the post-delete count and correctly refuses.
 */
export async function unlinkAccount(
  backerId: string,
  linkedAccountId: string,
): Promise<UnlinkResult> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "Backer" WHERE id = ${backerId} FOR UPDATE`;

    const row = await tx.linkedAccount.findUnique({ where: { id: linkedAccountId } });
    if (!row || row.backerId !== backerId) return { ok: false, error: "notFound" }; // no existence leak

    const [otherLinks, backer] = await Promise.all([
      tx.linkedAccount.count({ where: { backerId, id: { not: row.id } } }),
      tx.backer.findUniqueOrThrow({ where: { id: backerId }, select: { passwordHash: true } }),
    ]);
    if (!backer.passwordHash && otherLinks === 0) return { ok: false, error: "lockout" };

    await tx.linkedAccount.delete({ where: { id: row.id } });
    return { ok: true };
  });
}

import type { LinkedAccountProvider } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Whether an OAuth sign-in may proceed, and why not when it may not.
 *
 * Until now `jwt()` resolved an OAuth sign-in by **email match**: if the
 * address coming back from Google matched an existing account, the visitor was
 * silently signed into it. Auth0's own account-linking guidance names that as
 * the pattern to avoid, and PROGRESS has carried it as a known hazard needing
 * an owner decision — taken 2026-09-10: stop auto-attaching.
 *
 * The reason it is a hazard: a verified email proves the person controls that
 * address *at that provider today*, not that they are the person who created
 * the motoo account under it. Someone who registers a Google account on an
 * address that a motoo account already uses would have been handed that
 * account.
 *
 * The product already has the correct path — sign in the way you always have,
 * then link the provider from `/settings`, which runs its own OAuth client
 * (`src/lib/oauthLinking.ts`). So this refuses rather than inventing a flow.
 */
export type OAuthSignInVerdict =
  | { ok: true }
  | { ok: false; reason: "useExistingMethod" };

export async function resolveOAuthSignIn(input: {
  provider: string;
  providerAccountId?: string | null;
  email: string;
}): Promise<OAuthSignInVerdict> {
  const { provider, providerAccountId, email } = input;

  // Already linked: this identity has been proven against this account before,
  // so it is the account's own door. Resolving by the identity rather than by
  // the address is what this whole change is for.
  if (providerAccountId) {
    const link = await prisma.linkedAccount.findFirst({
      where: {
        provider: provider as LinkedAccountProvider,
        providerAccountId,
      },
      select: { id: true },
    });
    if (link) return { ok: true };
  }

  const existing = await prisma.backer.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      _count: { select: { linkedAccounts: true } },
    },
  });

  // Nobody holds this address: an ordinary first-time OAuth signup.
  if (!existing) return { ok: true };

  /**
   * An account exists on this address and this identity is not linked to it.
   *
   * Refuse — but only when the account has some other way in. An account with
   * no password and no linked identities can *only* have been created by OAuth,
   * before `LinkedAccount` existed (2026-09-04); its row was never backfilled
   * because a provider account id only arrives when the person signs in. For
   * those, this sign-in is almost certainly the original method, and refusing
   * would tell someone to use a door that does not exist and strand them out of
   * their own account. They are let through and `jwt()` writes the missing link
   * row, so each one self-heals on its next sign-in and the exception shrinks
   * toward nothing.
   *
   * The hazard this actually closes is the dangerous one: an account with a
   * password, or with other providers already attached, is never handed over on
   * the strength of a matching address alone.
   */
  const hasAnotherWayIn =
    Boolean(existing.passwordHash) || existing._count.linkedAccounts > 0;

  return hasAnotherWayIn ? { ok: false, reason: "useExistingMethod" } : { ok: true };
}

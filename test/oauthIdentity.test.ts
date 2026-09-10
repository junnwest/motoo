/**
 * Integration tests for `resolveOAuthSignIn` (src/lib/oauthIdentity.ts) — the
 * gate that stopped OAuth sign-in from silently attaching to an account just
 * because the email matched (owner decision 2026-09-10).
 *
 * Same shape as linkedAccounts.test.ts: real local Postgres (docker,
 * `pnpm db:up`), isolated *.motoo.test fixtures created and torn down here,
 * never seed data. Run: `pnpm test`.
 *
 * The two properties that matter pull in opposite directions, which is the
 * whole reason this needs tests rather than a reading:
 *   - an account that has its own way in is never handed over on a matching
 *     address alone, and
 *   - an account that has *no* other way in is never locked out by that rule,
 *     because OAuth-only accounts predating `LinkedAccount` have no link row
 *     and telling them to "use your original method" would name a door that
 *     does not exist.
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { resolveOAuthSignIn } from "@/lib/oauthIdentity";

const EMAIL_PW = "oauthid-pw@motoo.test";
const EMAIL_LEGACY = "oauthid-legacy@motoo.test";
const EMAIL_LINKED = "oauthid-linked@motoo.test";
const EMAILS = [EMAIL_PW, EMAIL_LEGACY, EMAIL_LINKED];

let withPassword: string;
let legacyOAuthOnly: string;
let alreadyLinked: string;

async function cleanup() {
  for (const email of EMAILS) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (!b) continue;
    await prisma.linkedAccount.deleteMany({ where: { backerId: b.id } });
    await prisma.backer.delete({ where: { id: b.id } });
  }
}

describe("resolveOAuthSignIn", () => {
  before(cleanup);
  after(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanup();

    // Signed up with email + password: has another way in.
    withPassword = (
      await prisma.backer.create({
        data: {
          email: EMAIL_PW,
          nickname: "pw",
          passwordHash: hashPassword("Testpass123"),
        },
        select: { id: true },
      })
    ).id;

    // Created by OAuth before LinkedAccount existed: no password, no links.
    legacyOAuthOnly = (
      await prisma.backer.create({
        data: { email: EMAIL_LEGACY, nickname: "legacy" },
        select: { id: true },
      })
    ).id;

    // Has this exact identity already linked.
    alreadyLinked = (
      await prisma.backer.create({
        data: { email: EMAIL_LINKED, nickname: "linked" },
        select: { id: true },
      })
    ).id;
    await prisma.linkedAccount.create({
      data: {
        backerId: alreadyLinked,
        provider: "google",
        providerAccountId: "google-known-1",
        email: EMAIL_LINKED,
      },
    });
  });

  it("lets a brand-new address through — an ordinary first OAuth signup", async () => {
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-brand-new",
      email: "oauthid-nobody@motoo.test",
    });
    assert.deepEqual(v, { ok: true });
  });

  it("refuses a matching address when the account has a password", async () => {
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-stranger",
      email: EMAIL_PW,
    });
    assert.deepEqual(v, { ok: false, reason: "useExistingMethod" });
    assert.ok(withPassword);
  });

  it("refuses a matching address when the account has another provider linked", async () => {
    // A different Google identity arriving at an account that already has one.
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-different-person",
      email: EMAIL_LINKED,
    });
    assert.deepEqual(v, { ok: false, reason: "useExistingMethod" });
  });

  it("lets the linked identity itself back in, every time", async () => {
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-known-1",
      email: EMAIL_LINKED,
    });
    assert.deepEqual(v, { ok: true });
  });

  it("resolves by identity, not by address — a changed email still signs in", async () => {
    // The person changed their Google address; the identity is unchanged. If
    // this resolved by email it would be treated as a brand-new signup.
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-known-1",
      email: "oauthid-changed@motoo.test",
    });
    assert.deepEqual(v, { ok: true });
  });

  it("does NOT strand a legacy OAuth-only account that has no link row", async () => {
    // The case that would otherwise lock people out: created by OAuth before
    // LinkedAccount existed, so there is nothing to match on and no password
    // to fall back to. Refusing here would tell them to use a door they
    // never had.
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-legacy-identity",
      email: EMAIL_LEGACY,
    });
    assert.deepEqual(v, { ok: true });
    assert.ok(legacyOAuthOnly);
  });

  it("stops letting that legacy account through once it has healed", async () => {
    // After one sign-in the link row exists, so the exception no longer
    // applies and a *different* identity on the same address is refused.
    await prisma.linkedAccount.create({
      data: {
        backerId: legacyOAuthOnly,
        provider: "google",
        providerAccountId: "google-legacy-identity",
        email: EMAIL_LEGACY,
      },
    });
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: "google-someone-else",
      email: EMAIL_LEGACY,
    });
    assert.deepEqual(v, { ok: false, reason: "useExistingMethod" });
  });

  it("treats a missing providerAccountId as unlinkable rather than trusted", async () => {
    const v = await resolveOAuthSignIn({
      provider: "google",
      providerAccountId: null,
      email: EMAIL_PW,
    });
    assert.deepEqual(v, { ok: false, reason: "useExistingMethod" });
  });
});

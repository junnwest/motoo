/**
 * Integration tests for connected-account linking (src/lib/linkedAccounts.ts)
 * and the pure OAuth profile extraction (src/lib/oauthLinking.ts).
 *
 * Same shape as passwordReset.test.ts: real local Postgres (docker,
 * `pnpm db:up`), isolated *.motoo.test fixtures created and torn down here,
 * never seed data. Run: `pnpm test`.
 *
 * The properties under test are the collision/lockout ones — this feature's
 * whole point is that linking and unlinking never leave an account either
 * stranded (no sign-in method left) or ambiguous (two backers who could both
 * plausibly own the same external identity).
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { linkAccount, unlinkAccount } from "@/lib/linkedAccounts";
import { PROVIDER_CONFIG } from "@/lib/oauthLinking";

const EMAIL_A = "linktest-a@motoo.test";
const EMAIL_B = "linktest-b@motoo.test";
const EMAIL_OAUTH_ONLY = "linktest-oauth@motoo.test";

let backerA: string;
let backerB: string;
let backerOAuthOnly: string;

async function cleanup() {
  for (const email of [EMAIL_A, EMAIL_B, EMAIL_OAUTH_ONLY]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } }); // cascades LinkedAccount
  }
}

before(async () => {
  await cleanup();
  const a = await prisma.backer.create({
    data: { email: EMAIL_A, nickname: "Link A", role: "backer", passwordHash: hashPassword("pw12345") },
  });
  backerA = a.id;
  const b = await prisma.backer.create({
    data: { email: EMAIL_B, nickname: "Link B", role: "backer", passwordHash: hashPassword("pw12345") },
  });
  backerB = b.id;
  const oauthOnly = await prisma.backer.create({
    data: { email: EMAIL_OAUTH_ONLY, nickname: "OAuth Only", role: "backer" }, // no passwordHash
  });
  backerOAuthOnly = oauthOnly.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.linkedAccount.deleteMany({
    where: { backerId: { in: [backerA, backerB, backerOAuthOnly] } },
  });
});

describe("linkAccount", () => {
  it("links a fresh identity", async () => {
    const res = await linkAccount(backerA, "google", "g-1", "somebody@gmail.com");
    assert.deepEqual(res, { ok: true });
    const row = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: "g-1" } },
    });
    assert.equal(row.backerId, backerA);
    assert.equal(row.email, "somebody@gmail.com");
  });

  it("linking with an email matching the caller's own current address still succeeds", async () => {
    const res = await linkAccount(backerA, "kakao", "k-self", EMAIL_A);
    assert.deepEqual(res, { ok: true });
  });

  it("relinking the same identity to the same backer is a no-op", async () => {
    await linkAccount(backerA, "naver", "n-1", "first@example.com");
    const before = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "naver", providerAccountId: "n-1" } },
    });

    const res = await linkAccount(backerA, "naver", "n-1", "different@example.com");
    assert.deepEqual(res, { ok: true });

    const after = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "naver", providerAccountId: "n-1" } },
    });
    assert.equal(after.email, before.email, "email must not be resynced on a repeat link");
    assert.deepEqual(after.linkedAt, before.linkedAt, "linkedAt must not move on a repeat link");
  });

  it("refuses an identity already linked to a different backer", async () => {
    await linkAccount(backerA, "google", "g-shared", "shared@gmail.com");
    const res = await linkAccount(backerB, "google", "g-shared", "shared@gmail.com");
    assert.deepEqual(res, { ok: false, error: "linkedElsewhere" });

    const row = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: "g-shared" } },
    });
    assert.equal(row.backerId, backerA, "the original link must be untouched");
  });

  it("refuses when the reported email already belongs to a different backer", async () => {
    const res = await linkAccount(backerA, "kakao", "k-collide", EMAIL_B);
    assert.deepEqual(res, { ok: false, error: "emailTaken" });

    const row = await prisma.linkedAccount.findUnique({
      where: { provider_providerAccountId: { provider: "kakao", providerAccountId: "k-collide" } },
    });
    assert.equal(row, null, "no row must be written on a rejected link");
  });

  it("allows an email with no owner at all (fresh, unclaimed address)", async () => {
    const res = await linkAccount(backerA, "naver", "n-fresh", "nobody-else-has-this@example.com");
    assert.deepEqual(res, { ok: true });
  });
});

describe("unlinkAccount", () => {
  it("succeeds when the backer has a password", async () => {
    await linkAccount(backerA, "google", "g-unlink-1", "x@gmail.com");
    const row = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: "g-unlink-1" } },
    });

    const res = await unlinkAccount(backerA, row.id);
    assert.deepEqual(res, { ok: true });
    assert.equal(await prisma.linkedAccount.findUnique({ where: { id: row.id } }), null);
  });

  it("succeeds when there are 2+ linked providers and no password", async () => {
    await linkAccount(backerOAuthOnly, "google", "g-oauth-1", "y@gmail.com");
    await linkAccount(backerOAuthOnly, "kakao", "k-oauth-1", "z@example.com");
    const googleRow = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: "g-oauth-1" } },
    });

    const res = await unlinkAccount(backerOAuthOnly, googleRow.id);
    assert.deepEqual(res, { ok: true });
  });

  it("refuses to strand a passwordless account with only one linked provider", async () => {
    await linkAccount(backerOAuthOnly, "naver", "n-only", "only@example.com");
    const row = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "naver", providerAccountId: "n-only" } },
    });

    const res = await unlinkAccount(backerOAuthOnly, row.id);
    assert.deepEqual(res, { ok: false, error: "lockout" });
    assert.notEqual(
      await prisma.linkedAccount.findUnique({ where: { id: row.id } }),
      null,
      "the row must not be deleted when refused",
    );
  });

  it("refuses (without leaking existence) a linkedAccountId belonging to someone else", async () => {
    await linkAccount(backerA, "google", "g-owned-by-a", "owner@gmail.com");
    const row = await prisma.linkedAccount.findUniqueOrThrow({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: "g-owned-by-a" } },
    });

    const res = await unlinkAccount(backerB, row.id);
    assert.deepEqual(res, { ok: false, error: "notFound" });
    assert.notEqual(await prisma.linkedAccount.findUnique({ where: { id: row.id } }), null);
  });

  it("returns notFound for a nonexistent id", async () => {
    const res = await unlinkAccount(backerA, "nonexistent-id");
    assert.deepEqual(res, { ok: false, error: "notFound" });
  });

  it("never strands a passwordless account when two links are removed at once", async () => {
    await linkAccount(backerOAuthOnly, "google", "g-race-1", "race1@example.com");
    await linkAccount(backerOAuthOnly, "kakao", "k-race-1", "race2@example.com");
    const [g, k] = await Promise.all([
      prisma.linkedAccount.findUniqueOrThrow({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: "g-race-1" } },
      }),
      prisma.linkedAccount.findUniqueOrThrow({
        where: { provider_providerAccountId: { provider: "kakao", providerAccountId: "k-race-1" } },
      }),
    ]);

    const results = await Promise.allSettled([
      unlinkAccount(backerOAuthOnly, g.id),
      unlinkAccount(backerOAuthOnly, k.id),
    ]);
    const succeeded = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok,
    ).length;

    assert.equal(succeeded, 1, "exactly one of two concurrent unlinks on the last two methods may succeed");
    const remaining = await prisma.linkedAccount.count({ where: { backerId: backerOAuthOnly } });
    assert.equal(remaining, 1, "the account must never end up with zero sign-in methods");
  });
});

describe("oauthLinking extractProfile", () => {
  it("google: reads sub as the account id", () => {
    const profile = PROVIDER_CONFIG.google.extractProfile({ sub: "1234567890", email: "g@example.com" });
    assert.deepEqual(profile, { providerAccountId: "1234567890", email: "g@example.com" });
  });

  it("google: tolerates a missing email", () => {
    const profile = PROVIDER_CONFIG.google.extractProfile({ sub: "1234567890" });
    assert.deepEqual(profile, { providerAccountId: "1234567890", email: null });
  });

  it("kakao: reads the numeric id and nested account email", () => {
    const profile = PROVIDER_CONFIG.kakao.extractProfile({
      id: 987654321,
      kakao_account: { email: "k@example.com", profile: { nickname: "카카오유저" } },
    });
    assert.deepEqual(profile, { providerAccountId: "987654321", email: "k@example.com" });
  });

  it("kakao: tolerates a missing kakao_account (no email consent granted)", () => {
    const profile = PROVIDER_CONFIG.kakao.extractProfile({ id: 987654321 });
    assert.deepEqual(profile, { providerAccountId: "987654321", email: null });
  });

  it("naver: reads the nested response object", () => {
    const profile = PROVIDER_CONFIG.naver.extractProfile({
      response: { id: "naver-id-1", email: "n@example.com", nickname: "네이버유저" },
    });
    assert.deepEqual(profile, { providerAccountId: "naver-id-1", email: "n@example.com" });
  });
});

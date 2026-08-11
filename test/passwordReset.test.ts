/**
 * Integration tests for password reset (src/lib/passwordReset.ts).
 *
 * Same shape as mochi.test.ts: real local Postgres (docker, `pnpm db:up`),
 * isolated *.motoo.test fixtures created and torn down here, never seed data.
 * Run: `pnpm test`.
 *
 * This flow can hand someone an account, so the properties under test are the
 * security ones — single use, expiry, session revocation, no enumeration —
 * rather than the happy path alone.
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  requestPasswordReset,
  checkResetToken,
  completePasswordReset,
  purgeStaleResetTokens,
} from "@/lib/passwordReset";

const EMAIL = "resettest-fan@motoo.test";
const OAUTH_EMAIL = "resettest-oauth@motoo.test";
const ORIGIN = "http://localhost:3000";
const OLD_PASSWORD = "oldpass123";
const NEW_PASSWORD = "newpass456";

let backerId: string;

/**
 * The token is emailed and never stored, so a test can't read it back from the
 * database. The mock provider prints it; rather than parse stdout, we mint rows
 * directly for the cases that need a known token, and use the real
 * `requestPasswordReset` for the cases that test its own behaviour.
 */
async function mintToken(
  token: string,
  opts: { expiresAt?: Date; usedAt?: Date } = {},
) {
  return prisma.passwordResetToken.create({
    data: {
      backerId,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: opts.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000),
      usedAt: opts.usedAt ?? null,
    },
  });
}

async function cleanup() {
  for (const email of [EMAIL, OAUTH_EMAIL]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } }); // cascades tokens
  }
}

before(async () => {
  await cleanup();
  const fan = await prisma.backer.create({
    data: {
      email: EMAIL,
      nickname: "Reset Fan",
      role: "backer",
      passwordHash: hashPassword(OLD_PASSWORD),
    },
  });
  backerId = fan.id;

  // No passwordHash: an OAuth-only account has nothing to reset.
  await prisma.backer.create({
    data: { email: OAUTH_EMAIL, nickname: "OAuth Only", role: "backer" },
  });
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.passwordResetToken.deleteMany({ where: { backerId } });
  await prisma.backer.update({
    where: { id: backerId },
    data: { passwordHash: hashPassword(OLD_PASSWORD), tokenVersion: 0 },
  });
});

describe("requestPasswordReset", () => {
  it("issues exactly one live token for a known account", async () => {
    await requestPasswordReset(EMAIL, ORIGIN);
    const live = await prisma.passwordResetToken.count({
      where: { backerId, usedAt: null },
    });
    assert.equal(live, 1);
  });

  it("stores a hash, never the token itself", async () => {
    await requestPasswordReset(EMAIL, ORIGIN);
    const row = await prisma.passwordResetToken.findFirstOrThrow({
      where: { backerId },
    });
    // sha256 hex is 64 chars; a base64url token of 32 bytes is 43.
    assert.equal(row.tokenHash.length, 64);
    assert.match(row.tokenHash, /^[0-9a-f]+$/);
  });

  it("retires an earlier outstanding token when a new one is requested", async () => {
    await requestPasswordReset(EMAIL, ORIGIN);
    await requestPasswordReset(EMAIL, ORIGIN);
    const live = await prisma.passwordResetToken.count({
      where: { backerId, usedAt: null },
    });
    assert.equal(live, 1, "the older link must stop working immediately");
  });

  it("does not reveal whether an account exists", async () => {
    const known = await requestPasswordReset(EMAIL, ORIGIN);
    const unknown = await requestPasswordReset("nobody@motoo.test", ORIGIN);
    assert.deepEqual(known, unknown);
  });

  it("issues nothing for an OAuth-only account, and still reports ok", async () => {
    const res = await requestPasswordReset(OAUTH_EMAIL, ORIGIN);
    assert.deepEqual(res, { ok: true });
    const oauth = await prisma.backer.findUniqueOrThrow({
      where: { email: OAUTH_EMAIL },
    });
    const count = await prisma.passwordResetToken.count({
      where: { backerId: oauth.id },
    });
    assert.equal(count, 0);
  });
});

describe("checkResetToken", () => {
  it("accepts a live token", async () => {
    await mintToken("live-token");
    assert.deepEqual(await checkResetToken("live-token"), {
      valid: true,
      backerId,
    });
  });

  it("distinguishes unknown, expired and used", async () => {
    await mintToken("expired-token", { expiresAt: new Date(Date.now() - 1000) });
    await mintToken("used-token", { usedAt: new Date() });

    assert.deepEqual(await checkResetToken("no-such-token"), {
      valid: false,
      reason: "unknown",
    });
    assert.deepEqual(await checkResetToken("expired-token"), {
      valid: false,
      reason: "expired",
    });
    assert.deepEqual(await checkResetToken("used-token"), {
      valid: false,
      reason: "used",
    });
  });
});

describe("completePasswordReset", () => {
  it("sets the new password and revokes existing sessions", async () => {
    await mintToken("good-token");
    const before = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });

    const res = await completePasswordReset("good-token", NEW_PASSWORD);
    assert.deepEqual(res, { ok: true });

    const after = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.ok(verifyPassword(NEW_PASSWORD, after.passwordHash!));
    assert.ok(!verifyPassword(OLD_PASSWORD, after.passwordHash!));
    assert.equal(
      after.tokenVersion,
      before.tokenVersion + 1,
      "a reset must invalidate sessions held by whoever knew the old password",
    );
  });

  it("consumes the token, so the same link cannot be reused", async () => {
    await mintToken("once-token");
    await completePasswordReset("once-token", NEW_PASSWORD);
    const second = await completePasswordReset("once-token", "otherpass789");
    assert.deepEqual(second, { ok: false, reason: "used" });

    const row = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.ok(
      verifyPassword(NEW_PASSWORD, row.passwordHash!),
      "the second attempt must not have changed the password",
    );
  });

  it("refuses an expired token and leaves the password alone", async () => {
    await mintToken("stale-token", { expiresAt: new Date(Date.now() - 1000) });
    const res = await completePasswordReset("stale-token", NEW_PASSWORD);
    assert.deepEqual(res, { ok: false, reason: "expired" });

    const row = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.ok(verifyPassword(OLD_PASSWORD, row.passwordHash!));
  });

  it("refuses an unknown token", async () => {
    const res = await completePasswordReset("never-issued", NEW_PASSWORD);
    assert.deepEqual(res, { ok: false, reason: "unknown" });
  });

  it("applies exactly once when the same link is clicked twice at once", async () => {
    await mintToken("race-token");
    const results = await Promise.allSettled([
      completePasswordReset("race-token", NEW_PASSWORD),
      completePasswordReset("race-token", "otherpass789"),
    ]);

    const ok = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok,
    ).length;
    assert.equal(ok, 1, "exactly one of two concurrent consumes may succeed");
  });
});

describe("purgeStaleResetTokens", () => {
  it("removes expired rows and keeps live ones", async () => {
    await mintToken("keep-me");
    await mintToken("sweep-me", { expiresAt: new Date(Date.now() - 1000) });

    await purgeStaleResetTokens();

    const remaining = await prisma.passwordResetToken.findMany({
      where: { backerId },
    });
    assert.equal(remaining.length, 1);
    assert.deepEqual(await checkResetToken("keep-me"), {
      valid: true,
      backerId,
    });
  });
});

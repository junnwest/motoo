/**
 * Integration tests for email verification and email change
 * (src/lib/emailVerification.ts). Real local Postgres, isolated *.motoo.test
 * fixtures, same conventions as the other suites. Run: `pnpm test`.
 *
 * The properties worth testing here are the takeover ones: an address must not
 * become the account's until its owner clicks, and a token must not survive
 * being used, expiring, or losing a race for an address someone else claimed.
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  sendVerificationEmail,
  requestEmailChange,
  consumeEmailToken,
  purgeStaleEmailTokens,
} from "@/lib/emailVerification";

const EMAIL = "verifytest@motoo.test";
const OTHER_EMAIL = "verifytest-other@motoo.test";
const NEW_EMAIL = "verifytest-new@motoo.test";
const ORIGIN = "http://localhost:3000";

let backerId: string;
let otherId: string;

async function mintToken(
  token: string,
  purpose: "verify" | "change",
  opts: { newEmail?: string; expiresAt?: Date; usedAt?: Date } = {},
) {
  return prisma.emailToken.create({
    data: {
      backerId,
      purpose,
      newEmail: opts.newEmail ?? null,
      tokenHash: createHash("sha256").update(token).digest("hex"),
      expiresAt: opts.expiresAt ?? new Date(Date.now() + 60 * 60 * 1000),
      usedAt: opts.usedAt ?? null,
    },
  });
}

async function cleanup() {
  for (const email of [EMAIL, OTHER_EMAIL, NEW_EMAIL]) {
    const b = await prisma.backer.findUnique({ where: { email } });
    if (b) await prisma.backer.delete({ where: { id: b.id } });
  }
}

before(async () => {
  await cleanup();
  const b = await prisma.backer.create({
    data: { email: EMAIL, nickname: "Verify Me", role: "backer" },
  });
  backerId = b.id;
  const o = await prisma.backer.create({
    data: { email: OTHER_EMAIL, nickname: "Someone Else", role: "backer" },
  });
  otherId = o.id;
});

after(async () => {
  await cleanup();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.emailToken.deleteMany({ where: { backerId } });
  await prisma.backer.update({
    where: { id: backerId },
    data: { email: EMAIL, emailVerifiedAt: null },
  });
  const stray = await prisma.backer.findUnique({ where: { email: NEW_EMAIL } });
  if (stray && stray.id !== otherId)
    await prisma.backer.delete({ where: { id: stray.id } });
});

describe("sendVerificationEmail", () => {
  it("issues one live token", async () => {
    await sendVerificationEmail(backerId, ORIGIN);
    const live = await prisma.emailToken.count({
      where: { backerId, purpose: "verify", usedAt: null },
    });
    assert.equal(live, 1);
  });

  it("retires the previous token when resent", async () => {
    await sendVerificationEmail(backerId, ORIGIN);
    await sendVerificationEmail(backerId, ORIGIN);
    const live = await prisma.emailToken.count({
      where: { backerId, purpose: "verify", usedAt: null },
    });
    assert.equal(live, 1);
  });

  it("does nothing once the address is already confirmed", async () => {
    await prisma.backer.update({
      where: { id: backerId },
      data: { emailVerifiedAt: new Date() },
    });
    await sendVerificationEmail(backerId, ORIGIN);
    const count = await prisma.emailToken.count({ where: { backerId } });
    assert.equal(count, 0);
  });
});

describe("consumeEmailToken — verify", () => {
  it("marks the address confirmed", async () => {
    await mintToken("verify-me", "verify");
    const res = await consumeEmailToken("verify-me");
    assert.deepEqual(res, { ok: true, purpose: "verify" });

    const row = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.ok(row.emailVerifiedAt);
  });

  it("rejects unknown, expired and already-used tokens", async () => {
    await mintToken("gone", "verify", {
      expiresAt: new Date(Date.now() - 1000),
    });
    await mintToken("spent", "verify", { usedAt: new Date() });

    assert.deepEqual(await consumeEmailToken("nope"), {
      ok: false,
      reason: "unknown",
    });
    assert.deepEqual(await consumeEmailToken("gone"), {
      ok: false,
      reason: "expired",
    });
    assert.deepEqual(await consumeEmailToken("spent"), {
      ok: false,
      reason: "used",
    });
  });
});

describe("requestEmailChange", () => {
  it("does not touch the account address until the link is clicked", async () => {
    const res = await requestEmailChange(backerId, NEW_EMAIL, ORIGIN);
    assert.deepEqual(res, { ok: true });

    const row = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.equal(
      row.email,
      EMAIL,
      "writing the new address before it is confirmed would let someone park an account on an address they do not own",
    );

    const token = await prisma.emailToken.findFirstOrThrow({
      where: { backerId, purpose: "change" },
    });
    assert.equal(token.newEmail, NEW_EMAIL);
  });

  it("refuses an address another account already holds", async () => {
    const res = await requestEmailChange(backerId, OTHER_EMAIL, ORIGIN);
    assert.deepEqual(res, { ok: false, error: "taken" });
  });

  it("refuses a change to the address already in use by this account", async () => {
    const res = await requestEmailChange(backerId, EMAIL, ORIGIN);
    assert.deepEqual(res, { ok: false, error: "same" });
  });
});

describe("consumeEmailToken — change", () => {
  it("moves the account and marks it confirmed", async () => {
    await mintToken("change-me", "change", { newEmail: NEW_EMAIL });
    const res = await consumeEmailToken("change-me");
    assert.deepEqual(res, { ok: true, purpose: "change" });

    const row = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.equal(row.email, NEW_EMAIL);
    assert.ok(
      row.emailVerifiedAt,
      "clicking the link on the new address is itself the proof of control",
    );
  });

  it("refuses if the address was claimed after the token was issued", async () => {
    // Issued while free…
    await mintToken("race-change", "change", { newEmail: NEW_EMAIL });
    // …then someone else takes it.
    await prisma.backer.update({
      where: { id: otherId },
      data: { email: NEW_EMAIL },
    });

    const res = await consumeEmailToken("race-change");
    assert.deepEqual(res, { ok: false, reason: "taken" });

    const row = await prisma.backer.findUniqueOrThrow({
      where: { id: backerId },
    });
    assert.equal(row.email, EMAIL, "the account must not have moved");

    await prisma.backer.update({
      where: { id: otherId },
      data: { email: OTHER_EMAIL },
    });
  });

  it("applies exactly once when the link is clicked twice at once", async () => {
    await mintToken("race-twice", "change", { newEmail: NEW_EMAIL });
    const results = await Promise.allSettled([
      consumeEmailToken("race-twice"),
      consumeEmailToken("race-twice"),
    ]);
    const ok = results.filter(
      (r) => r.status === "fulfilled" && r.value.ok,
    ).length;
    assert.equal(ok, 1);
  });
});

describe("purgeStaleEmailTokens", () => {
  it("removes expired rows and keeps live ones", async () => {
    await mintToken("keep", "verify");
    await mintToken("sweep", "verify", {
      expiresAt: new Date(Date.now() - 1000),
    });
    await purgeStaleEmailTokens();
    const left = await prisma.emailToken.findMany({ where: { backerId } });
    assert.equal(left.length, 1);
  });
});

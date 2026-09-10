/**
 * Integration tests for the one-person-one-account rule (owner decision
 * 2026-09-10): the DI returned by 본인인증 is stored on `Backer.verifiedDi`
 * under a unique index, so a second account by the same human is refused.
 *
 * Real local Postgres (docker, `pnpm db:up`), isolated *.motoo.test fixtures,
 * never seed data. Run: `pnpm test`.
 *
 * This is the property that could not previously be tested at all: the mock
 * derived its identifier from `backerId`, so one person signing up twice came
 * back as two different people and the check could never fire. These tests
 * exercise the mock's person mode alongside the constraint itself.
 */
import { describe, it, before, beforeEach, after } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { MockVerificationProvider } from "@/lib/verification/mock";

const EMAIL_FIRST = "di-first@motoo.test";
const EMAIL_SECOND = "di-second@motoo.test";
const EMAILS = [EMAIL_FIRST, EMAIL_SECOND];

async function cleanup() {
  await prisma.backer.deleteMany({ where: { email: { in: EMAILS } } });
}

/** Write a DI the way `verifyIdentity` does, surfacing the constraint. */
async function claimDi(backerId: string, di: string) {
  try {
    await prisma.backer.update({
      where: { id: backerId },
      data: { verifiedAt: new Date(), verifiedDi: di },
    });
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false as const, error: "duplicateIdentity" as const };
    }
    throw e;
  }
}

describe("one person, one account (verifiedDi)", () => {
  let first: string;
  let second: string;

  before(cleanup);
  after(async () => {
    await cleanup();
    delete process.env.VERIFICATION_MOCK_PERSON;
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanup();
    first = (
      await prisma.backer.create({
        data: { email: EMAIL_FIRST, nickname: "first" },
        select: { id: true },
      })
    ).id;
    second = (
      await prisma.backer.create({
        data: { email: EMAIL_SECOND, nickname: "second" },
        select: { id: true },
      })
    ).id;
  });

  it("the mock returns the same DI for one person across two accounts", async () => {
    process.env.VERIFICATION_MOCK_PERSON = "person-a";
    const p = new MockVerificationProvider();
    const a = await p.verify(first);
    const b = await p.verify(second);
    assert.equal(a.di, b.di, "same person must produce the same DI");
    assert.ok(a.di, "the mock must return a DI at all");
  });

  it("and different DIs for different people", async () => {
    delete process.env.VERIFICATION_MOCK_PERSON;
    const p = new MockVerificationProvider();
    const a = await p.verify(first);
    const b = await p.verify(second);
    assert.notEqual(a.di, b.di);
  });

  it("refuses the second account for the same person", async () => {
    process.env.VERIFICATION_MOCK_PERSON = "person-b";
    const p = new MockVerificationProvider();

    const one = await p.verify(first);
    assert.deepEqual(await claimDi(first, one.di!), { ok: true });

    const two = await p.verify(second);
    assert.deepEqual(await claimDi(second, two.di!), {
      ok: false,
      error: "duplicateIdentity",
    });
  });

  it("leaves the refused account unverified, not half-written", async () => {
    process.env.VERIFICATION_MOCK_PERSON = "person-c";
    const p = new MockVerificationProvider();
    const one = await p.verify(first);
    await claimDi(first, one.di!);
    const two = await p.verify(second);
    await claimDi(second, two.di!);

    const row = await prisma.backer.findUnique({
      where: { id: second },
      select: { verifiedAt: true, verifiedDi: true },
    });
    assert.equal(row?.verifiedDi, null);
    assert.equal(row?.verifiedAt, null, "a refused claim must write nothing");
  });

  it("lets the same account re-verify without tripping its own constraint", async () => {
    process.env.VERIFICATION_MOCK_PERSON = "person-d";
    const p = new MockVerificationProvider();
    const one = await p.verify(first);
    assert.deepEqual(await claimDi(first, one.di!), { ok: true });
    // Re-running verification on the same account must not look like a
    // duplicate of itself.
    assert.deepEqual(await claimDi(first, one.di!), { ok: true });
  });

  it("does not collide two accounts that have no DI yet", async () => {
    // Postgres allows many NULLs under a unique index, which is what lets
    // mock-verified legacy accounts be grandfathered rather than blocked.
    const rows = await prisma.backer.findMany({
      where: { email: { in: EMAILS } },
      select: { verifiedDi: true },
    });
    assert.equal(rows.length, 2);
    assert.ok(rows.every((r) => r.verifiedDi === null));
  });
});

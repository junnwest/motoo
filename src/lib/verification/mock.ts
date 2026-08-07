import type { VerificationProvider, VerifiedIdentity } from "./types";

/** 만 19세 — the age at which Korean law stops requiring guardian consent. */
const ADULT_AGE = 19;

/**
 * Is someone born in `birthYear` an adult? A real 본인확인기관 returns a full
 * birthdate, but `VerifiedIdentity` only carries the year, so this is the
 * conservative year-only reading: born exactly 19 years ago, they may not have
 * had their birthday yet, and we treat them as a minor rather than guess.
 * Replace with a real date comparison when an adapter supplies one.
 */
function isAdultBirthYear(birthYear: number, now = new Date()): boolean {
  return now.getFullYear() - birthYear > ADULT_AGE;
}

/**
 * Development verification provider. Simulates a completed 본인인증 without any real
 * carrier/PASS round-trip. Swap for a real NICE/PASS adapter (redirect +
 * callback) in production.
 *
 * `isAdult` is **derived from the birth year**, not hardcoded. It used to return
 * `true` unconditionally, which meant no account could ever be a minor — so the
 * guardian-consent gate in `buyMochi` would have shipped as untestable dead
 * code. Set `VERIFICATION_MOCK_MINOR=1` to have this return a minor instead, and
 * the whole minor path (blocked purchase → guardian consent) becomes exercisable
 * locally.
 */
export class MockVerificationProvider implements VerificationProvider {
  readonly name = "mock";

  async verify(backerId: string): Promise<VerifiedIdentity> {
    await delay(500); // simulate the round-trip so the UI's pending state shows
    // Deterministic from the backer id so repeat calls are stable.
    const h = hash(backerId);
    const thisYear = new Date().getFullYear();
    const birthYear =
      process.env.VERIFICATION_MOCK_MINOR === "1"
        ? thisYear - (14 + (h % 5)) // 만 14–18 → always a minor
        : 1988 + (h % 16); // 1988–2003 → an adult for decades yet
    const genders = ["female", "male", "other", "undisclosed"] as const;
    return {
      name: "김모찌",
      birthYear,
      gender: genders[h % genders.length],
      isAdult: isAdultBirthYear(birthYear),
      ci: `mock_ci_${backerId}`,
    };
  }
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

import type { VerificationProvider, VerifiedIdentity } from "./types";

/**
 * Development verification provider. Simulates a completed 본인인증 without any real
 * carrier/PASS round-trip: it returns a deterministic ADULT identity so the
 * onboarding flow can be exercised end-to-end. Swap for a real NICE/PASS adapter
 * (redirect + callback) in production.
 */
export class MockVerificationProvider implements VerificationProvider {
  readonly name = "mock";

  async verify(backerId: string): Promise<VerifiedIdentity> {
    await delay(500); // simulate the round-trip so the UI's pending state shows
    // Deterministic from the backer id so repeat calls are stable.
    const h = hash(backerId);
    const birthYear = 1988 + (h % 16); // 1988–2003 → always an adult in 2026
    const genders = ["female", "male", "other", "undisclosed"] as const;
    return {
      name: "김모찌",
      birthYear,
      gender: genders[h % genders.length],
      isAdult: true,
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

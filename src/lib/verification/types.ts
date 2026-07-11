/**
 * Identity verification (본인인증) abstraction.
 *
 * Korea gates payments on real identity verification, not a self-reported
 * birthdate. In production this is 휴대폰 본인확인 / PASS via a licensed 본인확인기관
 * (NICE, KCB, …): a redirect/callback flow that returns the verified legal name,
 * birth year, gender, and a CI (연계정보, unique per person). Those integrations
 * need a merchant contract + credentials, so v1 ships a MockVerificationProvider
 * that simulates a completed adult verification. Swap the adapter (env
 * VERIFICATION_PROVIDER) when a real contract exists.
 */

export type VerifiedGender = "female" | "male" | "other" | "undisclosed";

export interface VerifiedIdentity {
  /** verified legal name from the 본인확인기관 (not the display nickname) */
  name: string;
  birthYear: number;
  gender: VerifiedGender;
  /** 만 19세 이상 — gates payments; minors require guardian consent */
  isAdult: boolean;
  /** 연계정보: a stable per-person identifier used to prevent duplicate accounts */
  ci?: string;
}

export interface VerificationProvider {
  readonly name: string;
  /**
   * Run identity verification for a user. A real adapter redirects to the
   * 본인확인기관 and resolves on the callback; the mock resolves immediately with a
   * simulated adult identity.
   */
  verify(backerId: string): Promise<VerifiedIdentity>;
}

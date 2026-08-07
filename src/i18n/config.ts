/**
 * Korean only, deliberately (owner decision, 2026-08-06).
 *
 * `en.json` used to be maintained at full parity — 800+ keys — behind a
 * language switcher that was never built, so no user could ever reach it. It
 * was deleted rather than left as a second catalog nobody read.
 *
 * next-intl stays: it is what keeps copy out of components, which is a project
 * invariant independent of how many languages ship. Re-adding a locale means
 * adding a file here and a switcher; nothing else in the app assumes one.
 */
export const locales = ["ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

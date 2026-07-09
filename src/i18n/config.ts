export const locales = ["ko", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

/** Cookie that stores the user's chosen locale (set by the language switcher). */
export const LOCALE_COOKIE = "motoo_locale";

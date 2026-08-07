import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";

/**
 * next-intl without i18n routing: URLs stay clean (/explore, /s/[handle]) as
 * the product doc specifies.
 *
 * There is no locale negotiation because there is only one locale. The cookie
 * this used to read was written by a language switcher that never existed —
 * see ./config.
 */
export default getRequestConfig(async () => ({
  locale: defaultLocale,
  messages: (await import("../../messages/ko.json")).default,
}));

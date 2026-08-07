import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Web app manifest. Mostly this is what lets a Korean mobile user "add to home
 * screen" and get the brand name and color rather than a URL and a screenshot —
 * relevant given how much of this product's traffic is expected on phones.
 *
 * No `icons` yet: the repo has only a favicon.ico, and a manifest that points
 * at icon sizes which don't exist is worse than one that omits them (browsers
 * fall back to the favicon either way, but a broken reference shows up in
 * every audit). Add them here when real PNG icons land.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("meta");
  return {
    name: t("title"),
    short_name: t("siteName"),
    description: t("description"),
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ef",
    theme_color: "#fbf6ef",
    lang: "ko",
  };
}

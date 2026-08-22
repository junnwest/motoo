import type { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

/**
 * Web app manifest. Mostly this is what lets a Korean mobile user "add to home
 * screen" and get the brand name and color rather than a URL and a screenshot —
 * relevant given how much of this product's traffic is expected on phones.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations("meta");
  return {
    name: t("title"),
    short_name: t("siteName"),
    description: t("description"),
    start_url: "/",
    display: "standalone",
    background_color: "#fde9e2",
    theme_color: "#f15a29",
    lang: "ko",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

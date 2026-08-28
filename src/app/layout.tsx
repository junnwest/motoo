import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { defaultLocale } from "@/i18n/config";
import { SITE_URL } from "@/lib/metadata";
import "./globals.css";

// Pretendard is loaded from globals.css (self-hosted, not on Google Fonts) and
// is now the only text face. IBM Plex Mono went with the mono role on
// 2026-08-28 — it shipped `latin` only, so every Korean label that asked for it
// silently fell back to an OS font. See the type comment in globals.css.

// Fredoka (wordmark) and Baloo 2 ("studio" suffix) were removed 2026-08-28.
// The wordmark is Bauhaus 93 now, shipped as outlines in `BrandWordmark.tsx`
// because its licence does not permit webfont use — so both families existed
// only for a lockup that no longer renders as text, and were two font
// downloads on every page for five glyphs.

/**
 * Site-wide metadata. Was a single hardcoded title/description still selling
 * the retired Trust Report ("매달 한 장의 트러스트 리포트로") — which every page
 * in the app inherited, because this was the only `metadata` export anywhere.
 *
 * `title.template` means a page only supplies its own name; the suffix is
 * applied here so it can never drift page to page.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("title");
  const description = t("description");

  return {
    // Required for OG/canonical URLs to resolve absolutely. Scrapers reject or
    // mishandle relative ones.
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s · ${t("siteName")}` },
    description,
    applicationName: t("siteName"),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: t("siteName"),
      locale: "ko_KR",
      url: "/",
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
    formatDetection: { telephone: false },
  };
}

/**
 * Explicit viewport. Without this Next emits its default, which is fine, but
 * `themeColor` needs declaring anyway (it tints the browser chrome on Android
 * and iOS Safari) and `viewport-fit=cover` is what makes the
 * `env(safe-area-inset-*)` padding on the mobile tab bar resolve to anything
 * other than zero on notched devices.
 *
 * `maximumScale` is deliberately left unset: capping zoom is a WCAG 1.4.4
 * failure, and it's the most common way a mobile layout quietly becomes
 * unusable for low-vision users.
 */
export const viewport: Viewport = {
  themeColor: "#ff5722",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const t = await getTranslations("a11y");

  return (
    <html
      lang={defaultLocale}
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <NextIntlClientProvider>
          {/* Skip link (WCAG 2.4.1). Every page starts with the same nav, and
              every consumer page also has two rails — without this a keyboard
              or screen-reader user tabs through all of it on every navigation
              before reaching the content. Visually hidden until focused. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-ink focus:px-5 focus:py-3 focus:text-base focus:font-bold focus:text-cream"
          >
            {t("skipToContent")}
          </a>
          {children}
          {/* Vercel Analytics (docs/PRELAUNCH.md #17). Chosen over a product
              analytics tool specifically because it needs no consent banner:
              it sets no cookies and is served from this origin
              (`/_vercel/insights/*`), so no third party is involved and #10
              stays unnecessary. It also means the enforced CSP needs no
              widening — `script-src 'self'` already covers it, which is the
              payoff for not using 'strict-dynamic'.

              What it does not do is funnels. It answers "is the donate page
              being visited and are people leaving", not "which step lost
              them". */}
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

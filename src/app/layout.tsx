import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { locales } from "@/i18n/config";
import "./globals.css";

// Pretendard is loaded via CDN in globals.css (not on Google Fonts).
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "motoo — 팬의 응원을 스폰서에게 보여줄 증거로",
  description:
    "팬의 응원을 매달 한 장의 트러스트 리포트로. 브랜드·스폰서·MCN에게 진짜 팬덤을 증명하세요.",
};

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
  themeColor: "#fbf6ef",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const lang = hasLocale(locales, locale) ? locale : "ko";
  const t = await getTranslations("a11y");

  return (
    <html lang={lang} className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <NextIntlClientProvider>
          {/* Skip link (WCAG 2.4.1). Every page starts with the same nav, and
              every consumer page also has two rails — without this a keyboard
              or screen-reader user tabs through all of it on every navigation
              before reaching the content. Visually hidden until focused. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-[12px] focus:bg-ink focus:px-5 focus:py-3 focus:text-[15px] focus:font-bold focus:text-cream"
          >
            {t("skipToContent")}
          </a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

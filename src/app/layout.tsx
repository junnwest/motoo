import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getLocale } from "next-intl/server";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const lang = hasLocale(locales, locale) ? locale : "ko";

  return (
    <html lang={lang} className={`${ibmPlexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}

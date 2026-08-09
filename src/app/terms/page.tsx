import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("terms.title");
  const description = t("terms.description");
  return {
    title,
    description,
    alternates: { canonical: "/terms" },
    openGraph: { url: "/terms", title, description },
  };
}

export default async function TermsPage() {
  const t = await getTranslations("legal");
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[720px] flex-1 px-6 py-16">
        <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">
          {t("termsTitle")}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-body">
          {t("placeholder")}
        </p>
        <Link
          href="/onboarding"
          className="mt-8 inline-block text-sm font-semibold text-coral-deep hover:underline"
        >
          ← {t("back")}
        </Link>
      </main>
      <Footer variant="fan" />
    </>
  );
}

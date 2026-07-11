import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { OnboardingForm } from "./OnboardingForm";

export default async function CreatorOnboardingPage() {
  const t = await getTranslations("creatorOnboarding");

  return (
    <>
      <Nav variant="creator" />
      <section className="mx-auto w-full max-w-[640px] flex-1 px-6 py-14 sm:py-20">
        <header className="mb-8 text-center">
          <Eyebrow className="justify-center">{t("eyebrow")}</Eyebrow>
          <h1 className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
            {t("title")}
          </h1>
          <p className="mt-3 text-[16px] leading-[1.6] text-body">
            {t("subtitle")}
          </p>
        </header>

        <OnboardingForm />
      </section>
      <Footer variant="creator" />
    </>
  );
}

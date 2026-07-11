import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getCurrentBacker } from "@/lib/session";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const backer = await getCurrentBacker();
  if (!backer) redirect("/login");
  if (backer.onboardedAt) redirect("/");

  const t = await getTranslations("onboarding");

  return (
    <>
      <Nav variant="fan" />
      <section className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center px-5 py-12">
        <div className="mb-6 text-center">
          <Eyebrow className="justify-center">{t("eyebrow")}</Eyebrow>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">
            {t("title")}
          </h1>
          <p className="mt-2 text-[15px] leading-[1.6] text-body">
            {t("subtitle")}
          </p>
        </div>
        <OnboardingForm
          defaultNickname={backer.nickname}
          alreadyVerified={!!backer.verifiedAt}
        />
      </section>
    </>
  );
}

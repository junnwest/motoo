import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { CreatorSetupForm } from "./OnboardingForm";

export default async function CreatorSetupPage() {
  // Becoming a creator is an add-on for a signed-in, onboarded user. (The
  // middleware already forces user onboarding before this page is reachable.)
  const user = await getCurrentBacker();
  if (!user) redirect("/api/become-creator"); // routes to signup, remembers intent
  const studio = await prisma.streamer.findUnique({
    where: { ownerId: user.id },
    select: { id: true },
  });
  if (studio) redirect("/studio"); // already a creator

  const t = await getTranslations("creatorOnboarding");

  return (
    <>
      <Nav variant="fan" />
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

        <CreatorSetupForm defaultName={user.nickname} />
      </section>
      <Footer variant="fan" />
    </>
  );
}

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
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
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[640px] flex-1 px-6 py-14 sm:py-20">
        {/* Hierarchy: what this page IS ("크리에이터 시작하기") is the H1; what it
            gets you ("나만의 모찌 마켓을 열어보세요") supports it. It used to be
            inverted — a mono eyebrow naming the page above a much louder pitch
            line — so the loudest text on screen didn't say where you were. */}
        <header className="mb-8 text-center">
          <h1 className="text-[28px] font-extrabold tracking-[-0.02em] sm:text-[32px]">
            {t("title")}
          </h1>
          <p className="mt-2.5 text-[17px] font-bold text-coral-deep sm:text-[18px]">
            {t("tagline")}
          </p>
          <p className="mt-2 text-[15.5px] leading-[1.6] text-body">
            {t("subtitle")}
          </p>
        </header>

        <CreatorSetupForm
          defaultName={user.nickname}
          defaultHandle={user.handle ?? ""}
        />
      </main>
      <Footer variant="fan" />
    </>
  );
}

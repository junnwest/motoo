import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { prisma } from "@/lib/db";
import { getCurrentBacker } from "@/lib/session";
import { OnboardingForm } from "./OnboardingForm";

export default async function OnboardingPage() {
  const backer = await getCurrentBacker();
  // A present session but no Backer means a stale/dead session (e.g. the account
  // was removed by a dev reseed). Clear it instead of bouncing to /login, which
  // the middleware would send right back here → redirect loop.
  if (!backer) redirect("/api/session-reset");
  if (backer.onboardedAt) redirect("/");

  // Durably capture "become a creator" intent the moment the user first reaches
  // onboarding — the creatorIntent cookie is still fresh here (minutes after
  // signup, before any OAuth round-trip or multi-day gap can drop it). We flip
  // it onto the Backer row so completeOnboarding routes to /creator/onboarding
  // no matter how long the user takes to finish. Idempotent + best-effort: a
  // failure here must never block onboarding.
  if (!backer.creatorIntent) {
    const wantsCreator = (await cookies()).get("creatorIntent")?.value === "1";
    if (wantsCreator) {
      try {
        await prisma.backer.update({
          where: { id: backer.id },
          data: { creatorIntent: true },
        });
      } catch {
        // Best-effort; the cookie still serves as a same-session fallback below.
      }
    }
  }

  const t = await getTranslations("onboarding");

  return (
    <>
      <Nav />
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

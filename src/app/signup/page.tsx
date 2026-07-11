import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Mochi } from "@/components/Mochi";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const t = await getTranslations("auth");
  const providers = getEnabledOAuthProviders();
  const benefits = [
    t("signupBenefit1"),
    t("signupBenefit2"),
    t("signupBenefit3"),
  ];

  return (
    <>
      <Nav variant="fan" />
      <section className="mx-auto grid w-full max-w-[1080px] flex-1 grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-14">
        {/* Left: warm value-prop hero */}
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(155deg,#f7eadd_0%,#f2b5a0_100%)] px-8 py-12 sm:px-12 sm:py-16">
          {/* decorative floating mochi */}
          <Mochi
            width={130}
            height={106}
            float
            className="pointer-events-none absolute -right-6 -top-8 opacity-60"
          />
          <Mochi
            width={70}
            height={57}
            float
            floatDelay={1.6}
            className="pointer-events-none absolute -bottom-4 right-20 opacity-45"
          />
          <div className="relative">
            <span className="inline-flex">
              <Mochi width={46} height={38} float />
            </span>
            <h2 className="mt-6 max-w-[400px] text-[30px] font-extrabold leading-[1.25] tracking-[-0.02em] text-ink sm:text-[37px]">
              {t("signupHeroTitle")}
            </h2>
            <p className="mt-4 max-w-[380px] text-[16px] leading-[1.6] text-ink/70">
              {t("signupHeroSubtitle")}
            </p>
            <ul className="mt-9 flex flex-col gap-3.5">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-3 text-[15px] font-medium text-ink"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/75 text-[13px] font-bold text-coral-deep">
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: sign-up form */}
        <div className="flex items-center justify-center lg:px-4">
          <div className="w-full max-w-[400px]">
            <div className="mb-6">
              <h1 className="text-[27px] font-extrabold tracking-[-0.02em] text-ink">
                {t("signupTitle")}
              </h1>
              <p className="mt-1.5 text-[15px] text-body">
                {t("signupSubtitle")}
              </p>
            </div>
            <SignupForm providers={providers} />
          </div>
        </div>
      </section>
    </>
  );
}

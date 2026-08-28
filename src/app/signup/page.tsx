import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Nav } from "@/components/Nav";
import { Mochi } from "@/components/Mochi";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import { SignupForm } from "./SignupForm";
import { INVITE_COOKIE } from "@/lib/inviteCookie";
import { PRELAUNCH } from "@/lib/prelaunch";
import {
  IconAward,
  IconTag,
  IconTrend,
  IconSend,
  IconLock,
} from "@/components/ui/Icons";

export default async function SignupPage() {
  const t = await getTranslations("auth");
  const tPre = await getTranslations("prelaunch");
  const providers = getEnabledOAuthProviders();
  const jar = await cookies();
  // Set by the "become a creator" entry: signing up now continues to Studio setup.
  const creatorMode = jar.get("creatorIntent")?.value === "1";
  // Arriving through /join/<token>. The generic hero is a *fan* pitch — wrong
  // audience for someone we approached directly, and the wrong register for
  // what is meant to read as a private invitation.
  const invited = PRELAUNCH && Boolean(jar.get(INVITE_COOKIE)?.value);
  const benefits = [
    t("signupBenefit1"),
    t("signupBenefit2"),
    t("signupBenefit3"),
  ];
  const invitePerks = [
    { Icon: IconAward, label: tPre("perk1Title") },
    { Icon: IconTag, label: tPre("perk2Title") },
    { Icon: IconTrend, label: tPre("perk3Title") },
    { Icon: IconSend, label: tPre("perk4Title") },
  ];

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto grid w-full max-w-[1080px] flex-1 grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:py-14">
        {/* Left: an invitation for someone we approached, the fan pitch for
            everyone else. Dark and quiet on purpose — this should read as a
            private letter, not a signup ad, and it also makes the invited path
            visibly different from the public one at a glance. */}
        {invited ? (
          <div className="relative overflow-hidden border border-dark-line bg-ink px-8 py-12 sm:px-12 sm:py-14">
            <span className="inline-flex items-center gap-2 border border-coral/40 px-3 py-1 text-2xs font-semibold uppercase tracking-[0.14em] text-coral-tint">
              {tPre("inviteEyebrow")}
            </span>
            <h2 className="mt-7 max-w-[420px] break-keep text-3xl font-extrabold leading-snug tracking-[-0.02em] text-dark-text sm:text-4xl">
              {tPre("inviteTitle")}
            </h2>
            <p className="mt-4 max-w-[400px] break-keep text-base leading-relaxed text-dark-text-2">
              {tPre("inviteBody")}
            </p>

            <p className="mt-10 text-2xs font-semibold uppercase tracking-[0.12em] text-dark-text-3">
              {tPre("invitePerksLead")}
            </p>
            <ul className="mt-4 grid grid-cols-1 gap-px overflow-hidden border border-dark-line bg-dark-line sm:grid-cols-2">
              {invitePerks.map(({ Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 bg-ink-2 px-4 py-3.5 text-sm font-semibold text-dark-text"
                >
                  <Icon className="h-4 w-4 flex-none text-coral-tint" />
                  <span className="break-keep">{label}</span>
                </li>
              ))}
            </ul>

            <p className="mt-8 flex items-center gap-2 text-2xs text-dark-text-3">
              <IconLock className="h-3.5 w-3.5 flex-none" />
              {tPre("inviteSingleUse")}
            </p>
          </div>
        ) : (
        <div className="relative overflow-hidden rounded-2xl bg-coral-soft px-8 py-12 sm:px-12 sm:py-16">
          {/* decorative floating mochi */}
          <Mochi
            width={130}
            height={106}
            float
            className="pointer-events-none absolute -right-6 -top-8 text-white/70"
          />
          <Mochi
            width={70}
            height={57}
            float
            floatDelay={1.6}
            className="pointer-events-none absolute -bottom-4 right-20 text-white/50"
          />
          <div className="relative">
            <span className="inline-flex">
              <Mochi width={46} height={38} float className="text-coral-deep" />
            </span>
            <h2 className="mt-6 max-w-[400px] text-3xl font-extrabold leading-snug tracking-[-0.02em] text-ink sm:text-4xl">
              {t("signupHeroTitle")}
            </h2>
            <p className="mt-4 max-w-[380px] text-base leading-relaxed text-ink/70">
              {t("signupHeroSubtitle")}
            </p>
            <ul className="mt-9 flex flex-col gap-3.5">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="flex items-center gap-3 text-base font-medium text-ink"
                >
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-white/75 text-xs font-bold text-coral-deep">
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>
        )}

        {/* Right: sign-up form */}
        <div className="flex items-center justify-center lg:px-4">
          <div className="w-full max-w-[400px]">
            {creatorMode && (
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-coral-chip px-3 py-1 text-xs font-semibold text-coral-deep">
                <Mochi width={14} height={11} className="text-coral-deep" /> {t("creatorSignupBadge")}
              </div>
            )}
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold tracking-[-0.02em] text-ink">
                {creatorMode ? t("creatorSignupTitle") : t("signupTitle")}
              </h1>
              <p className="mt-1.5 text-base text-body">
                {creatorMode
                  ? t("creatorSignupSubtitle")
                  : t("signupSubtitle")}
              </p>
            </div>
            <SignupForm providers={providers} creatorMode={creatorMode} />
          </div>
        </div>
      </main>
    </>
  );
}

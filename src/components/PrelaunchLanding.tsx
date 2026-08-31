import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { IconAward, IconTag, IconTrend, IconSend } from "@/components/ui/Icons";
import { ButtonLink } from "@/components/ui/Button";
import { FoundingBadge } from "@/components/FoundingBadge";
import { MarketingNudge } from "@/components/MarketingNudge";

/**
 * The public face of motoo while `PRELAUNCH=1`.
 *
 * Everything else is private (see `src/proxy.ts`), so this is the only page a
 * stranger can reach besides the legal pages and the login/invite doors. It
 * says three things and nothing more: what motoo is, that it is not open yet,
 * and that invited creators start from their link.
 *
 * There is deliberately **no signup CTA and no invite-code field**. Signup is
 * reached only by opening `/join/<token>`, so a form here would be a door with
 * no key behind it — and a code box invites guessing at something that is
 * supposed to be unguessable.
 *
 * The launch landing is untouched in `page.tsx`; flipping the env var brings it
 * back.
 */
export async function PrelaunchLanding({
  signedIn,
}: {
  /**
   * Present when someone is signed in. During pre-launch a signed-in non-admin
   * cannot reach the app at all, so `/` is where they land — and landing on a
   * page that says "only invited creators can sign up" after being invited and
   * signing up would read as a failure. They get a confirmation instead.
   */
  signedIn?: {
    creatorHandle: string | null;
    founding: boolean;
    owedMarketingNudge?: boolean;
  } | null;
} = {}) {
  const t = await getTranslations("prelaunch");

  const perks = [
    { Icon: IconAward, title: t("perk1Title"), body: t("perk1Body") },
    { Icon: IconTag, title: t("perk2Title"), body: t("perk2Body") },
    { Icon: IconTrend, title: t("perk3Title"), body: t("perk3Body") },
    { Icon: IconSend, title: t("perk4Title"), body: t("perk4Body") },
  ];

  return (
    <>
      <Nav />
      <main id="main">
        <section className="px-6 pb-16 pt-20 sm:px-14 sm:pb-20 sm:pt-28">
          <div className="mx-auto max-w-[720px] text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-line-3 bg-card px-3.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-coral" />
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-coral-deep">
                {signedIn
                  ? signedIn.creatorHandle
                    ? t("doneEyebrow")
                    : signedIn.founding
                      ? t("resumeEyebrow")
                      : t("doneEyebrow")
                  : t("eyebrow")}
              </span>
            </div>

            {signedIn ? (
              <>
                <h1 className="break-keep text-4xl font-extrabold leading-tight tracking-[-0.04em] sm:text-6xl">
                  {signedIn.creatorHandle
                    ? t("doneTitle")
                    : signedIn.founding
                      ? t("resumeTitle")
                      : t("waitTitle")}
                </h1>
                <p className="mx-auto mt-6 max-w-[540px] break-keep text-lg leading-relaxed text-body">
                  {signedIn.creatorHandle
                    ? t("doneBody")
                    : signedIn.founding
                      ? t("resumeBody")
                      : t("waitBody")}
                </p>

                {signedIn.creatorHandle ? (
                  <div className="mx-auto mt-8 flex max-w-[420px] flex-col items-center gap-3 border border-line-2 bg-card px-8 py-6">
                    <span className="text-2xs font-semibold uppercase tracking-[0.08em] text-muted">
                      {t("doneHandle")}
                    </span>
                    <span className="text-2xl font-extrabold tracking-[-0.02em]">
                      @{signedIn.creatorHandle}
                    </span>
                    {signedIn.founding ? (
                      <FoundingBadge label={t("foundingBadge")} />
                    ) : null}

                    {/* The reserved handle is one of the four things we
                        promised, so it cannot be a value you are shown and
                        cannot change — a typo in it would otherwise be
                        permanent until launch. Both settings surfaces are
                        reachable during pre-launch for exactly this reason
                        (src/lib/prelaunch.ts): the handle and creator profile
                        live in the Studio's settings, the account fields in
                        /settings. */}
                    <div className="mt-5 grid w-full grid-cols-1 gap-px overflow-hidden border border-line-2 bg-line sm:grid-cols-2">
                      <Link
                        href="/studio/settings"
                        className="group bg-card px-4 py-3 text-left transition hover:bg-coral-chip"
                      >
                        <span className="block text-sm font-bold text-ink group-hover:text-coral-deep">
                          {t("editStudio")}
                        </span>
                        <span className="mt-0.5 block break-keep text-2xs text-muted">
                          {t("editStudioHint")}
                        </span>
                      </Link>
                      <Link
                        href="/settings"
                        className="group bg-card px-4 py-3 text-left transition hover:bg-coral-chip"
                      >
                        <span className="block text-sm font-bold text-ink group-hover:text-coral-deep">
                          {t("editAccount")}
                        </span>
                        <span className="mt-0.5 block break-keep text-2xs text-muted">
                          {t("editAccountHint")}
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : signedIn.founding ? (
                  /* Invited, account made, Studio not set up yet — the one
                     thing they are still allowed to do. Distinct from the plain
                     "wait for launch" state below: telling someone with unfinished
                     setup to sit tight, directly above a button asking them to
                     finish it, is a contradiction they have to resolve themselves. */
                  <div className="mt-8">
                    <ButtonLink
                      href="/creator/onboarding"
                      variant="primary"
                      size="lg"
                    >
                      {t("doneSetupCta")}
                    </ButtonLink>
                  </div>
                ) : null}

                {signedIn.owedMarketingNudge ? (
                  <MarketingNudge
                    t={{
                      title: t("nudgeTitle"),
                      body: t("nudgeBody"),
                      note: t("nudgeNote"),
                      accept: t("nudgeAccept"),
                      decline: t("nudgeDecline"),
                      thanks: t("nudgeThanks"),
                    }}
                  />
                ) : null}

                <p className="mt-8 text-sm text-muted">
                  <Link
                    href="/api/logout"
                    className="font-semibold text-coral-deep hover:underline"
                  >
                    {t("logout")}
                  </Link>
                </p>
              </>
            ) : (
              <>
                <h1 className="break-keep text-4xl font-extrabold leading-tight tracking-[-0.04em] sm:text-6xl">
                  {t("title")}
                </h1>
                <p className="mx-auto mt-6 max-w-[540px] break-keep text-lg leading-relaxed text-body">
                  {t("body")}
                </p>

                <p className="mt-8 break-keep text-sm text-muted">
                  {t("haveInvite")}
                </p>
                <p className="mt-2 text-sm text-muted">
                  {t("loginPrompt")}{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-coral-deep hover:underline"
                  >
                    {t("loginCta")}
                  </Link>
                </p>
              </>
            )}
          </div>
        </section>

        {/* What motoo is — a stranger landing here has no other page to learn from. */}
        <section className="mx-auto max-w-[860px] px-6 pb-20 sm:px-14">
          <div className="border border-line-2 bg-card px-8 py-9 sm:px-10">
            <h2 className="break-keep text-xl font-bold">{t("what")}</h2>
            <p className="mt-3 break-keep text-base leading-relaxed text-body">
              {t("whatBody")}
            </p>
          </div>
        </section>

        {/* What an invited creator gets. Each of these is a promise we have to
            keep at launch — see DECISIONS 2026-08-28 (pre-launch). */}
        <section className="mx-auto max-w-[1200px] px-6 pb-20 sm:px-14 sm:pb-24">
          <h2 className="mb-8 break-keep text-2xl font-extrabold tracking-[-0.03em] sm:text-4xl">
            {t("perksTitle")}
          </h2>
          <div className="grid grid-cols-1 gap-px overflow-hidden border border-line-2 bg-line sm:grid-cols-2 lg:grid-cols-4">
            {perks.map(({ Icon, title, body }) => (
              <div key={title} className="bg-card p-7">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-coral-chip text-coral-deep">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 break-keep text-lg font-bold">{title}</h3>
                <p className="mt-2 break-keep text-base leading-relaxed text-body">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

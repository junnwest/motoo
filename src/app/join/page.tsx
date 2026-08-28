import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { INVITE_COOKIE } from "@/lib/inviteCookie";
import { checkInvite } from "@/lib/invites";
import {
  IconAward,
  IconTag,
  IconTrend,
  IconSend,
  IconLock,
} from "@/components/ui/Icons";

/**
 * `/join` — the invitation itself.
 *
 * `/join/<token>` is a Route Handler (it has to set a cookie, which a Server
 * Component cannot do). It validates the token, parks it, and sends the visitor
 * here. So this page is the first thing an invited creator actually reads, and
 * it deliberately is **not** the signup form: being handed a form is what a
 * public product does. An invitation should be read first and accepted second,
 * and the accept is a single link onward to signup.
 *
 * It renders three states from one place:
 *  - a valid invite in the cookie  → the invitation
 *  - `?e=` from the Route Handler  → why the link did not work
 *  - neither                       → someone found /join on their own
 */
const REASONS = ["unknown", "revoked", "spent"] as const;
type Reason = (typeof REASONS)[number];

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const t = await getTranslations("prelaunch");

  // An explicit error from /join/<token> wins: the visitor just came from a
  // link that did not work, and telling them why beats showing an invitation
  // they cannot use.
  if (e) {
    const reason: Reason = REASONS.includes(e as Reason)
      ? (e as Reason)
      : "unknown";
    return (
      <Shell>
        <h1 className="break-keep text-2xl font-extrabold tracking-[-0.02em]">
          {t(`joinError.${reason}Title`)}
        </h1>
        <p className="mt-3 break-keep text-base leading-relaxed text-body">
          {t(`joinError.${reason}Body`)}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <ButtonLink href="/" variant="secondary" size="md">
            {t("backHome")}
          </ButtonLink>
          {reason === "spent" ? (
            <Link
              href="/login"
              className="text-sm font-semibold text-coral-deep hover:underline"
            >
              {t("joinError.spentLogin")}
            </Link>
          ) : null}
        </div>
      </Shell>
    );
  }

  // Re-checked here, not trusted from the redirect: the cookie outlives the
  // hop, and an invite can be spent or revoked between arriving and reading.
  const token = (await cookies()).get(INVITE_COOKIE)?.value;
  const state = token ? await checkInvite(token) : null;

  if (!state?.ok) {
    return (
      <Shell>
        <h1 className="break-keep text-2xl font-extrabold tracking-[-0.02em]">
          {t("noInviteTitle")}
        </h1>
        <p className="mt-3 break-keep text-base leading-relaxed text-body">
          {t("noInviteBody")}
        </p>
        <div className="mt-8">
          <ButtonLink href="/" variant="secondary" size="md">
            {t("backHome")}
          </ButtonLink>
        </div>
      </Shell>
    );
  }

  const perks = [
    { Icon: IconAward, title: t("perk1Title"), body: t("perk1Body") },
    { Icon: IconTag, title: t("perk2Title"), body: t("perk2Body") },
    { Icon: IconTrend, title: t("perk3Title"), body: t("perk3Body") },
    { Icon: IconSend, title: t("perk4Title"), body: t("perk4Body") },
  ];

  return (
    <>
      <Nav />
      <main id="main" className="px-5 py-12 sm:px-8 sm:py-20">
        {/* The letter. Dark and full-width so it reads as its own thing rather
            than a panel bolted onto a form. */}
        <div className="mx-auto max-w-[760px] border border-dark-line bg-ink px-7 py-12 text-center sm:px-14 sm:py-16">
          <span className="inline-flex items-center border border-coral/40 px-3.5 py-1.5 text-2xs font-semibold uppercase tracking-[0.18em] text-coral-tint">
            {t("letterEyebrow")}
          </span>

          <h1 className="mt-8 break-keep text-3xl font-extrabold leading-tight tracking-[-0.03em] text-dark-text sm:text-5xl">
            {t("letterTitle")}
          </h1>
          <p className="mx-auto mt-5 max-w-[460px] break-keep text-base leading-relaxed text-dark-text-2 sm:text-lg">
            {t("letterLead")}
          </p>

          <div className="mx-auto mt-10 max-w-[520px] border-t border-dark-line pt-8 text-left">
            <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-dark-text-3">
              {t("letterWhatTitle")}
            </p>
            <p className="mt-3 break-keep text-base leading-relaxed text-dark-text-2">
              {t("letterWhatBody")}
            </p>
          </div>

          <p className="mt-12 text-2xs font-semibold uppercase tracking-[0.12em] text-dark-text-3">
            {t("letterPerksTitle")}
          </p>
          <ul className="mt-5 grid grid-cols-1 gap-px overflow-hidden border border-dark-line bg-dark-line text-left sm:grid-cols-2">
            {perks.map(({ Icon, title, body }) => (
              <li key={title} className="bg-ink-2 p-6">
                <Icon className="h-5 w-5 text-coral-tint" />
                <h2 className="mt-3.5 break-keep text-base font-bold text-dark-text">
                  {title}
                </h2>
                <p className="mt-1.5 break-keep text-sm leading-relaxed text-dark-text-3">
                  {body}
                </p>
              </li>
            ))}
          </ul>

          {/* The accept. One way onward — the invite is already parked in a
              cookie, so /api/become-creator picks up the creator intent and
              signup reads the token from there. */}
          <div className="mt-12">
            <ButtonLink href="/api/become-creator" variant="primary" size="lg">
              {t("letterCta")}
            </ButtonLink>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-2xs text-dark-text-3">
            <IconLock className="h-3.5 w-3.5 flex-none" />
            {t("letterSingleUse")}
          </p>
          <p className="mt-3 text-sm text-dark-text-3">
            {t("letterAlready")}{" "}
            <Link
              href="/login"
              className="font-semibold text-coral-tint hover:underline"
            >
              {t("loginCta")}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

/** Shared frame for the two non-invitation states. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="px-6 py-24 sm:px-14">
        <div className="mx-auto max-w-[520px] border border-line-2 bg-card p-10 text-center shadow-soft">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NOINDEX } from "@/lib/metadata";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/db";
import { getCurrentBacker, getSession } from "@/lib/session";
import { GuardianConsentForm } from "./GuardianConsentForm";

/** About one account's guardian. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

/**
 * 법정대리인 동의 capture (docs/PRELAUNCH.md #31).
 *
 * The money path has refused a verified minor without recorded consent since
 * the eligibility work went in, and nothing could ever record it — so the
 * branch existed, was correct, and was unreachable. Every minor was
 * permanently blocked with no route forward.
 *
 * Who sees it is decided from 본인인증 data, never from the form: an adult is
 * sent away, and someone who hasn't verified is sent to verify first. Letting
 * the page decide from user input would turn it into a way to self-declare an
 * age, which is the one thing this whole path exists to prevent.
 */
export default async function GuardianConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login?next=/guardian-consent");

  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset");

  const me = await prisma.backer.findUnique({
    where: { id: backer.id },
    select: { verifiedAt: true, ageVerified: true, guardianConsent: true },
  });
  if (!me?.verifiedAt) redirect("/onboarding");
  // An adult has nothing to do here, and a minor who already has consent on
  // file manages it from /settings rather than by filling the form twice.
  if (me.ageVerified || me.guardianConsent === true) redirect("/settings");

  const t = await getTranslations("guardian");
  const { next } = await searchParams;
  // Only an in-app path, never an absolute URL — a `next` that can point off
  // site is an open redirect, and this one arrives from a link a fan followed.
  const returnTo = next?.startsWith("/") && !next.startsWith("//") ? next : null;

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[560px] flex-1 px-6 py-16">
        <h1 className="break-keep text-2xl font-extrabold tracking-[-0.02em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-3 break-keep text-base leading-relaxed text-body">
          {t("subtitle")}
        </p>
        {/* Says out loud that this is a record, not a verification. Claiming
            more than the product does would be the worse failure — see the
            action's header. */}
        <p className="mt-4 break-keep border-l-2 border-line-2 pl-4 text-sm leading-relaxed text-muted">
          {t("honesty")}
        </p>

        <GuardianConsentForm returnTo={returnTo} />

        <Link
          href="/youth"
          className="mt-8 inline-block text-sm font-semibold text-coral-deep hover:underline"
        >
          {t("policyLink")}
        </Link>
      </main>
      <Footer variant="fan" />
    </>
  );
}

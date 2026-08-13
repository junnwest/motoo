import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { NOINDEX } from "@/lib/metadata";
import { consumeEmailToken } from "@/lib/emailVerification";

export const metadata: Metadata = { robots: NOINDEX };

/**
 * Confirms an address — either the one already on the account, or a move to a
 * new one; the token knows which.
 *
 * Consumed here on render rather than behind a button. That is the opposite of
 * the password reset page, and the difference is what the click does: a reset
 * hands over an account and must not be spent by a mail scanner prefetching the
 * link, while confirming an address the user already gave us is idempotent in
 * spirit — the worst a prefetch does is confirm it slightly early, for someone
 * who by definition controls the inbox.
 */
export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("auth.verify");
  const res = await consumeEmailToken(token);

  const title = res.ok
    ? res.purpose === "change"
      ? t("changedTitle")
      : t("verifiedTitle")
    : t("failedTitle");
  const body = res.ok
    ? res.purpose === "change"
      ? t("changedBody")
      : t("verifiedBody")
    : t(`errors.${res.reason}`);

  return (
    <>
      <Nav />
      <main
        id="main"
        className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20"
      >
        <div className="rounded-xl border border-line-2 bg-card p-8 text-center shadow-[0_10px_40px_rgba(0,0,0,.04)]">
          <div className="flex flex-col items-center">
            <Mochi width={40} height={33} float />
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em] break-keep">
              {title}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-body break-keep">
              {body}
            </p>
          </div>

          <Link
            href={res.ok ? "/home" : "/settings"}
            className="mt-6 inline-block text-sm font-semibold text-coral-deep hover:underline"
          >
            {res.ok ? t("continueCta") : t("settingsCta")} →
          </Link>
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}

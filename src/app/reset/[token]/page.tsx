import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { NOINDEX } from "@/lib/metadata";
import { checkResetToken } from "@/lib/passwordReset";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { robots: NOINDEX };

/**
 * The token is validated here, before the form renders, so a dead link says so
 * immediately instead of after the user has typed a new password twice. It is
 * only *checked* — consuming happens on submit, or a mail-scanner prefetching
 * the link would burn it before the user ever clicked.
 */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("auth.reset");
  const state = await checkResetToken(token);

  return (
    <>
      <Nav />
      <main
        id="main"
        className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20"
      >
        <div className="rounded-xl border border-line-2 bg-card p-8 shadow-[0_10px_40px_rgba(0,0,0,.04)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <Mochi width={40} height={33} float />
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em] break-keep">
              {state.valid ? t("newTitle") : t("invalidTitle")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-body break-keep">
              {state.valid ? t("newSubtitle") : t(`errors.${state.reason}`)}
            </p>
          </div>

          {state.valid ? (
            <ResetForm token={token} />
          ) : (
            <Link
              href="/forgot"
              className="block text-center text-sm font-semibold text-coral-deep hover:underline"
            >
              {t("requestSubmit")} →
            </Link>
          )}
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}

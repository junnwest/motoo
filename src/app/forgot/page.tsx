import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { NOINDEX } from "@/lib/metadata";
import { isEmailDeliveryEnabled } from "@/lib/email";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";
import { ForgotForm } from "./ForgotForm";

/** Account recovery: never indexed, same as every other signed-in surface. */
export const metadata: Metadata = { robots: NOINDEX };

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.reset");

  return (
    <>
      <Nav />
      <main
        id="main"
        className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20"
      >
        <div className="rounded-xl border border-line-2 bg-card p-8 shadow-soft">
          <div className="mb-6 flex flex-col items-center text-center">
            <Mochi width={40} height={33} float className="text-coral-soft" />
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">
              {t("requestTitle")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-body break-keep">
              {isEmailDeliveryEnabled()
                ? t("requestSubtitle")
                : t("unavailableSubtitle")}
            </p>
          </div>

          {/* With no mail provider configured there is no point showing a form
              whose success message is a promise we cannot keep — the action
              reports success for every address on purpose, so the user would
              wait for a link that only ever reached a server log. Offer the
              support channel instead, which is the one route that does work.
              Disappears by itself the moment EMAIL_PROVIDER is set. */}
          {isEmailDeliveryEnabled() ? (
            <ForgotForm />
          ) : (
            <div>
              <p className="break-keep text-base leading-relaxed text-body">
                {t("unavailableBody")}
              </p>
              {SUPPORT_EMAIL ? (
                <a
                  href={supportMailto()!}
                  className="mt-4 inline-block text-base font-semibold text-coral-deep underline"
                >
                  {SUPPORT_EMAIL}
                </a>
              ) : null}
              <Link
                href="/login"
                className="mt-6 block text-sm font-semibold text-coral-deep hover:underline"
              >
                ← {t("backToLogin")}
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}

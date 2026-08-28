import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { NOINDEX } from "@/lib/metadata";
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
            <Mochi width={40} height={33} float />
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">
              {t("requestTitle")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-body break-keep">
              {t("requestSubtitle")}
            </p>
          </div>

          <ForgotForm />
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}

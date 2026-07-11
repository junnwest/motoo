import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  const providers = getEnabledOAuthProviders();

  return (
    <>
      <Nav variant="fan" />
      <section className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20">
        <div className="rounded-[20px] border border-line-2 bg-card p-8 shadow-[0_10px_40px_rgba(0,0,0,.04)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <Mochi width={40} height={33} float />
            <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.02em]">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-body">
              {t("loginSubtitle")}
            </p>
          </div>

          <LoginForm providers={providers} />
        </div>

        <p className="mt-6 text-center text-[14px] text-muted">
          {t("signupNoLoginPrompt")}{" "}
          <Link
            href="/signup"
            className="font-semibold text-coral-deep hover:underline"
          >
            {t("goSignup")}
          </Link>
        </p>
        <p className="mt-2 text-center text-[14px] text-muted">
          {t("noAccount")}{" "}
          <Link
            href="/api/become-creator"
            className="font-semibold text-coral-deep hover:underline"
          >
            {t("goOnboarding")}
          </Link>
        </p>
      </section>
      <Footer variant="fan" />
    </>
  );
}

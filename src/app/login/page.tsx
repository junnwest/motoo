import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { SignupButton } from "@/components/SignupButton";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const t = await getTranslations("auth");
  const providers = getEnabledOAuthProviders();

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20">
        <div className="rounded-xl border border-line-2 bg-card p-8 shadow-[0_10px_40px_rgba(0,0,0,.04)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <Mochi width={40} height={33} float />
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-body">
              {t("loginSubtitle")}
            </p>
          </div>

          <LoginForm providers={providers} />
        </div>

        <div className="mt-6 flex flex-col items-center gap-2.5">
          <p className="text-center text-sm text-muted">
            {t("signupNoLoginPrompt")}
          </p>
          <SignupButton
            label={t("signupButton")}
            variant="secondary"
            size="md"
          />
        </div>
      </main>
      <Footer variant="fan" />
    </>
  );
}

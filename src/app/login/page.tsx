import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { SignupButton } from "@/components/SignupButton";
import { getEnabledOAuthProviders } from "@/lib/auth-providers";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const t = await getTranslations("auth");
  const providers = getEnabledOAuthProviders();
  // Set by auth.ts's signIn callback when an OAuth identity was refused
  // because the address already belongs to an account with its own way in.
  const { e } = await searchParams;
  const refusedLink = e === "useExistingMethod";

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20">
        <div className="rounded-xl border border-line-2 bg-card p-8 shadow-soft">
          <div className="mb-6 flex flex-col items-center text-center">
            <Mochi width={40} height={33} float className="text-coral-soft" />
            <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.02em]">
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-body">
              {t("loginSubtitle")}
            </p>
          </div>

          {refusedLink ? (
            <p className="mb-5 break-keep border border-line-2 bg-panel px-4 py-3 text-sm leading-relaxed text-body">
              {t("linkExistingNotice")}
            </p>
          ) : null}

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

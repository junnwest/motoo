import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { Section } from "@/components/ui/Section";
import { getCurrentBacker } from "@/lib/session";
import { IdentityForm } from "./SettingsForm";
import { PasswordForm } from "./PasswordForm";

/**
 * Fan account settings — apex-only route, distinct from the Studio host's own
 * `/settings` (creator profile: bio, platform links). No collision: the two
 * are on different hosts, and `src/proxy.ts`'s studio rewrite only fires when
 * the request host starts with `studio.` (see isStudioPage).
 */
export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const t = await getTranslations("settings");
  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset");

  return (
    <>
      <ConsumerShell>
        <main className="mx-auto max-w-[640px] px-6 py-12 sm:px-10 sm:py-16">
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-ink sm:text-[34px]">
            {t("title")}
          </h1>
          <p className="mt-2 text-[15.5px] text-body">{t("subtitle")}</p>

          <Section title={t("identityTitle")} className="mt-10">
            <IdentityForm
              initialNickname={backer.nickname}
              initialHandle={backer.handle ?? ""}
            />
          </Section>

          <Section title={t("passwordTitle")} className="mt-6">
            {backer.passwordHash ? (
              <PasswordForm />
            ) : (
              <p className="text-[14px] text-muted">{t("oauthOnly")}</p>
            )}
          </Section>
        </main>
      </ConsumerShell>
      <Footer variant="fan" />
    </>
  );
}

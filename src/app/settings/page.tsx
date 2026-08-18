import type { Metadata } from "next";
import { NOINDEX } from "@/lib/metadata";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Section } from "@/components/ui/Section";
import { getCurrentBacker, getSession } from "@/lib/session";
import { getHoldingsForBacker } from "@/lib/mochi";
import { AccountSection } from "@/components/AccountSection";
import { ACCOUNT_DELETION_GRACE_DAYS } from "@/lib/accountDeletion";
import { IdentityForm } from "./SettingsForm";
import { AvatarForm } from "./AvatarForm";
import { PasswordForm } from "./PasswordForm";
import { EmailForm } from "./EmailForm";
import { MarketingConsentForm } from "./MarketingConsentForm";
import { GuardianConsentSection } from "./GuardianConsentSection";
import { formatKstDate } from "@/lib/format";

/** Signed-in surface: one person’s balances and history. Never indexed. */
export const metadata: Metadata = { robots: NOINDEX };

/**
 * Fan account settings — apex-only route, distinct from the Studio host's own
 * `/settings` (creator profile: bio, platform links). No collision: the two
 * are on different hosts, and `src/proxy.ts`'s studio rewrite only fires when
 * the request host starts with `studio.` (see isStudioPage).
 */
export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/");

  const t = await getTranslations("settings");
  const tg = await getTranslations("guardian");
  const backer = await getCurrentBacker();
  if (!backer) redirect("/api/session-reset");

  // Stated in the delete confirmation: what happens to unspent mochi is the
  // part of leaving that users actually care about.
  const holdings = await getHoldingsForBacker(backer.id);
  const unspentMochi = holdings.reduce((sum, h) => sum + h.balance, 0);

  // Comes from 본인인증, never self-reported — `ageVerified` is only false once
  // a provider has actually said so, which is why an unverified account (both
  // flags absent) is not treated as a minor here.
  const isMinor = !!backer.verifiedAt && !backer.ageVerified;

  return (
    <>
      <ConsumerShell>
        <div className="mx-auto max-w-[640px] px-6 py-12 sm:px-10 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-[-0.03em] text-ink sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-base text-body">{t("subtitle")}</p>

          {/* boxed: a form-group, not a content shelf — the Spotify reference
              (DECISIONS 2026-07-31) that keeps other Sections bare doesn't
              apply to a settings form the same way. */}
          <Section title={t("avatarTitle")} boxed className="mt-10">
            <AvatarForm initialAvatar={backer.avatarUrl} />
          </Section>

          {/* Above identity on purpose: the address is what account recovery
              runs through, so an unconfirmed one is the most consequential
              thing on this page. */}
          <Section title={t("email.sectionTitle")} boxed className="mt-6">
            <EmailForm
              email={backer.email}
              verified={!!backer.emailVerifiedAt}
              canChange={!!backer.passwordHash}
            />
          </Section>

          <Section title={t("marketing.sectionTitle")} boxed className="mt-6">
            <MarketingConsentForm initial={backer.marketingConsent} />
          </Section>

          {/* Only for accounts 본인인증 says are minors. An adult has no
              guardian to record and shouldn't be shown a section implying they
              might, so this is absent rather than empty for most people. */}
          {isMinor && (
            <Section title={tg("settingsTitle")} boxed className="mt-6">
              <GuardianConsentSection
                recorded={
                  backer.guardianConsent === true && backer.guardianName
                    ? {
                        name: backer.guardianName,
                        relation: tg(
                          `relations.${backer.guardianRelation ?? "other"}` as never,
                        ),
                        date: formatKstDate(
                          backer.guardianConsentAt ?? new Date(),
                        ),
                      }
                    : null
                }
              />
            </Section>
          )}

          <Section title={t("identityTitle")} boxed className="mt-6">
            <IdentityForm
              initialNickname={backer.nickname}
              initialHandle={backer.handle ?? ""}
            />
          </Section>

          <Section title={t("passwordTitle")} boxed className="mt-6">
            {backer.passwordHash ? (
              <PasswordForm />
            ) : (
              <p className="text-sm text-muted">{t("oauthOnly")}</p>
            )}
          </Section>

          {/* PIPA rights of access and erasure — neither existed before. */}
          <div className="mt-6">
            <AccountSection
              graceDays={ACCOUNT_DELETION_GRACE_DAYS}
              unspentMochi={unspentMochi}
              pendingDeletionAt={
                backer.pendingDeletionAt?.toISOString() ?? null
              }
            />
          </div>
        </div>
      </ConsumerShell>
    </>
  );
}

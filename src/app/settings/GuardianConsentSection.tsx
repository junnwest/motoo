"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, ButtonLink } from "@/components/ui/Button";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { withdrawGuardianConsentAction } from "@/app/guardian-consent/actions";

/**
 * The standing state of a minor's guardian consent, and the way out of it.
 *
 * Withdrawal lives here rather than on the consent page for the same reason
 * marketing consent does: 개인정보보호법 wants withdrawing to be no harder than
 * granting, and settings is where a person looks for "undo what I agreed to".
 * It re-blocks donating immediately, which the copy says before the click
 * rather than after.
 */
export function GuardianConsentSection({
  recorded,
}: {
  recorded: { name: string; relation: string; date: string } | null;
}) {
  const t = useTranslations("guardian");
  const router = useRouter();
  const [withdrawn, setWithdrawn] = useState(false);
  const [pending, start] = useTransition();

  if (withdrawn) {
    return (
      <InlineMessage tone="success">{t("settingsWithdrawn")}</InlineMessage>
    );
  }

  if (!recorded) {
    return (
      <div>
        <p className="break-keep text-base leading-relaxed text-body">
          {t("settingsNeeded")}
        </p>
        <ButtonLink
          href="/guardian-consent"
          variant="primary"
          size="md"
          className="mt-4"
        >
          {t("settingsCta")}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div>
      <p className="break-keep text-base leading-relaxed text-body">
        {t("settingsRecorded", {
          name: recorded.name,
          relation: recorded.relation,
          date: recorded.date,
        })}
      </p>
      <Button
        type="button"
        variant="secondary"
        size="md"
        className="mt-4"
        loading={pending}
        onClick={() =>
          start(async () => {
            const res = await withdrawGuardianConsentAction();
            if (res.ok) {
              setWithdrawn(true);
              router.refresh();
            }
          })
        }
      >
        {t("settingsWithdraw")}
      </Button>
    </div>
  );
}

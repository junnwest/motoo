"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { setMarketingConsentAction } from "./email-actions";

/**
 * A checkbox, saving on change with no confirm step.
 *
 * Withdrawal has to be at least as easy as consent was, and consent was one tick
 * during onboarding — so a "save" button that someone can forget to press would
 * itself be the friction the rule prohibits. Optimistic, reverting if the write
 * fails, so the control never claims something the database does not agree with.
 */
export function MarketingConsentForm({ initial }: { initial: boolean }) {
  const t = useTranslations("settings.marketing");
  const [consent, setConsent] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div>
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={consent}
          disabled={pending}
          className="mt-1 accent-coral"
          onChange={(e) => {
            const next = e.target.checked;
            setConsent(next); // optimistic
            setError(null);
            setSaved(false);
            start(async () => {
              const res = await setMarketingConsentAction(next);
              if (res.ok) setSaved(true);
              else {
                setConsent(!next); // revert
                setError(res.error);
              }
            });
          }}
        />
        <span className="text-sm leading-normal text-body break-keep">
          {t("label")}
        </span>
      </label>

      {saved && (
        <InlineMessage tone="success" className="mt-2">
          {consent ? t("optedIn") : t("optedOut")}
        </InlineMessage>
      )}
      {error && (
        <InlineMessage tone="error" className="mt-2">
          {t("error")}
        </InlineMessage>
      )}
    </div>
  );
}

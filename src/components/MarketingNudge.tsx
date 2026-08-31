"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { answerMarketingNudge } from "@/app/actions/marketingNudge";

/**
 * A **single** follow-up on marketing consent, for someone who declined it at
 * onboarding.
 *
 * Owner's call (2026-08-31): we need a way to reach pre-launch creators when the
 * product launches, so the declined consent is re-asked once after onboarding.
 *
 * The important word is *once*. 마케팅 수신 동의 is 선택 by law and cannot be a
 * condition of using the product; re-asking a consent somebody already declined
 * is the pattern Korean guidance is least comfortable with, and repeatedly doing
 * it would be indefensible. Both buttons — accept *and* decline — record
 * `marketingPromptedAt`, so this component can never appear twice. Declining is
 * a plain, equally-weighted button, not a muted afterthought.
 */
export function MarketingNudge({
  t,
}: {
  /** Strings passed in — this renders inside a server-rendered page. */
  t: {
    title: string;
    body: string;
    note: string;
    accept: string;
    decline: string;
    thanks: string;
  };
}) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  if (done) {
    return (
      <p className="mt-8 text-sm text-muted">{t.thanks}</p>
    );
  }

  const answer = (consent: boolean) =>
    start(async () => {
      await answerMarketingNudge({ consent }).catch(() => {});
      setDone(true);
    });

  return (
    <div className="mx-auto mt-10 max-w-[420px] border border-line-2 bg-card px-6 py-5 text-left">
      <h2 className="break-keep text-base font-bold text-ink">{t.title}</h2>
      <p className="mt-2 break-keep text-sm leading-relaxed text-body">
        {t.body}
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="primary"
          size="md"
          onClick={() => answer(true)}
          disabled={pending}
        >
          {t.accept}
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => answer(false)}
          disabled={pending}
        >
          {t.decline}
        </Button>
      </div>
      <p className="mt-3 break-keep text-2xs text-muted">{t.note}</p>
    </div>
  );
}

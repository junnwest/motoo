"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { IconCheckCircle } from "@/components/ui/Icons";
import {
  changeEmailAction,
  resendVerificationAction,
} from "./email-actions";

/**
 * Current address + its verified state + the change flow.
 *
 * The change form asks for the current password, and the copy says why. This
 * is the takeover path — move the account to an address you control, then use
 * "forgot password" — so a stolen session alone must not be enough. OAuth-only
 * accounts have no password to check, so they are not offered the form at all
 * rather than being waved through on the weakest possible gate.
 */
export function EmailForm({
  email,
  verified,
  canChange,
}: {
  email: string;
  verified: boolean;
  /** False for OAuth-only accounts (no password to re-authenticate with). */
  canChange: boolean;
}) {
  const t = useTranslations("settings.email");
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sentChange, setSentChange] = useState(false);
  const [resent, setResent] = useState(false);
  const [pending, startTransition] = useTransition();
  const [resending, startResend] = useTransition();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-panel px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-muted-2">
            {t("current")}
          </div>
          <div className="truncate text-base font-bold text-ink">{email}</div>
        </div>
        {verified ? (
          <span className="flex items-center gap-1 rounded-full bg-sage-bg px-2.5 py-1 text-2xs font-semibold text-sage">
            <IconCheckCircle width={13} height={13} />
            {t("verified")}
          </span>
        ) : (
          <span className="rounded-full bg-coral-chip px-2.5 py-1 text-2xs font-semibold text-coral-deep">
            {t("unverified")}
          </span>
        )}
      </div>

      {!verified && (
        <div className="mt-3">
          <p className="text-sm leading-normal text-body break-keep">
            {t("unverifiedBody")}
          </p>
          {resent ? (
            <InlineMessage tone="success" className="mt-2">
              {t("resent")}
            </InlineMessage>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="mt-2"
              loading={resending}
              onClick={() =>
                startResend(async () => {
                  const res = await resendVerificationAction();
                  if (res.ok) setResent(true);
                  else setError(res.error);
                })
              }
            >
              {resending ? t("resending") : t("resend")}
            </Button>
          )}
        </div>
      )}

      <h3 className="mt-6 text-base font-extrabold text-ink">
        {t("changeTitle")}
      </h3>

      {!canChange ? (
        <p className="mt-2 text-sm text-muted break-keep">{t("oauthOnly")}</p>
      ) : sentChange ? (
        <InlineMessage tone="success" className="mt-2">
          {t("changeSent")}
        </InlineMessage>
      ) : (
        <form
          className="mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            startTransition(async () => {
              const res = await changeEmailAction({
                newEmail,
                currentPassword: password,
              });
              if (res.ok) setSentChange(true);
              else setError(res.error);
            });
          }}
        >
          <Input
            type="email"
            required
            autoComplete="email"
            label={t("newEmail")}
            value={newEmail}
            disabled={pending}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            type="password"
            required
            autoComplete="current-password"
            label={t("currentPassword")}
            fieldClassName="mt-3"
            value={password}
            disabled={pending}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <InlineMessage tone="error" className="mt-3">
              {t(`errors.${error}`)}
            </InlineMessage>
          )}
          <Button
            type="submit"
            variant="secondary"
            size="md"
            className="mt-3"
            loading={pending}
          >
            {pending ? t("changeSubmitting") : t("changeSubmit")}
          </Button>
        </form>
      )}
    </div>
  );
}

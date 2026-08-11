"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { PASSWORD_RE } from "@/lib/passwordPolicy";
import { completeResetAction } from "@/app/forgot/actions";

/**
 * New-password form for a token the server already validated when rendering.
 * It can still fail on submit — a link can expire in the seconds between render
 * and submit, or be consumed in another tab — so the error path is real, not
 * defensive padding.
 *
 * On success it does NOT sign the user in: the reset revoked every session, and
 * quietly logging them in would hide that. They're sent to /login instead.
 */
export function ResetForm({ token }: { token: string }) {
  const t = useTranslations("auth.reset");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div>
        <h2 className="text-lg font-extrabold text-ink break-keep">
          {t("doneTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("doneBody")}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-coral-deep hover:underline"
        >
          {t("loginCta")} →
        </Link>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Checked here as well as server-side: a mismatch is the user's own typo,
    // and a round trip to be told so is a worse experience than an instant no.
    if (password !== confirm) return setError("mismatch");
    if (!PASSWORD_RE.test(password)) return setError("weakPassword");

    startTransition(async () => {
      const res = await completeResetAction({ token, password });
      if (res.ok) setDone(true);
      else setError(res.error);
    });
  }

  return (
    <form onSubmit={submit}>
      <Input
        type="password"
        required
        autoComplete="new-password"
        label={t("passwordLabel")}
        hint={t("passwordHint")}
        value={password}
        disabled={pending}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Input
        type="password"
        required
        autoComplete="new-password"
        label={t("confirmLabel")}
        fieldClassName="mt-4"
        value={confirm}
        disabled={pending}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {error && (
        <InlineMessage tone="error" className="mt-3">
          {t(`errors.${error}`)}
        </InlineMessage>
      )}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-4 w-full"
        loading={pending}
      >
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

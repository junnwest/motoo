"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { SocialButtons } from "@/components/SocialButtons";
import type { EnabledProviders } from "@/lib/auth-providers";
import { signupUser } from "./actions";

export function SignupForm({
  providers,
  creatorMode = false,
}: {
  providers: EnabledProviders;
  creatorMode?: boolean;
}) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Password policy (mirrors the server): 8+ chars incl. a letter and a number.
  const reqLength = password.length >= 8;
  const reqLetter = /[A-Za-z]/.test(password);
  const reqNumber = /\d/.test(password);
  const passwordValid = reqLength && reqLetter && reqNumber;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit =
    !!nickname.trim() && !!email && passwordValid && !mismatch && confirm === password && !pending;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordValid) return setError("weakPassword");
    if (password !== confirm) return setError("passwordMismatch");
    startTransition(async () => {
      const res = await signupUser({ nickname, email, password });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Full navigation, not router.push — a soft transition lets Next resolve
      // "/" without requesting it, so the onboarding gate never runs and a
      // brand-new account skips onboarding. See signup/actions.ts.
      window.location.assign("/");
    });
  }

  const reqs: [boolean, string][] = [
    [reqLength, t("passwordReqLength")],
    [reqLetter, t("passwordReqLetter")],
    [reqNumber, t("passwordReqNumber")],
  ];

  return (
    <div>
      {/* Email / password */}
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label={t("nickname")}
          type="text"
          autoComplete="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t("nicknamePlaceholder")}
          required
        />

        <Input
          label={t("email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          label={t("password")}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("passwordPlaceholder")}
          required
          // As `hint`, the live requirement checklist is picked up by
          // aria-describedby — so a screen reader hears which rules are still
          // unmet when the field is focused, instead of only seeing them.
          hint={
            <span className="mt-0.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px]">
              {reqs.map(([ok, label]) => (
                <span
                  key={label}
                  className={`flex items-center gap-1 ${
                    ok ? "text-sage" : "text-muted"
                  }`}
                >
                  <span className="text-[11px]">{ok ? "✓" : "○"}</span>
                  {label}
                </span>
              ))}
            </span>
          }
        />

        <Input
          label={t("passwordConfirm")}
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t("passwordConfirmPlaceholder")}
          required
          error={mismatch ? t("passwordMismatch") : undefined}
        />

        {error && <InlineMessage tone="error">{t(error)}</InlineMessage>}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!canSubmit}
          className="mt-1 w-full"
        >
          {pending ? t("signingUp") : t("signupButton")}
        </Button>
      </form>

      <SocialButtons providers={providers} />

      {/* Secondary links */}
      <p className="mt-6 text-center text-[14px] text-muted">
        {t("haveAccount")}{" "}
        <Link
          href="/login"
          className="font-semibold text-coral-deep hover:underline"
        >
          {t("goLogin")}
        </Link>
      </p>
      <p className="mt-2 text-center text-[14px] text-muted">
        {creatorMode ? (
          <Link
            href="/api/fan-signup"
            className="font-semibold text-coral-deep hover:underline"
          >
            {t("plainSignupLink")}
          </Link>
        ) : (
          <>
            {t("creatorPrompt")}{" "}
            <Link
              href="/api/become-creator"
              className="font-semibold text-coral-deep hover:underline"
            >
              {t("goOnboarding")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

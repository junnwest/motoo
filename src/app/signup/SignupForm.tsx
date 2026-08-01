"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "@/components/SocialButtons";
import type { EnabledProviders } from "@/lib/auth-providers";
import { signupUser } from "./actions";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-coral/60";

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
      // On success signupUser throws NEXT_REDIRECT (handled by the framework);
      // it only ever returns on failure.
      const res = await signupUser({ nickname, email, password });
      if (res && !res.ok) setError(res.error);
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
        <div>
          <label htmlFor="nickname" className={labelClass}>
            {t("nickname")}
          </label>
          <input
            id="nickname"
            type="text"
            autoComplete="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("nicknamePlaceholder")}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            required
            className={inputClass}
          />
          <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px]">
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
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className={labelClass}>
            {t("passwordConfirm")}
          </label>
          <input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t("passwordConfirmPlaceholder")}
            required
            className={`${inputClass} ${
              mismatch ? "border-live focus:border-live" : ""
            }`}
          />
          {mismatch && (
            <p className="mt-1.5 text-[12.5px] font-medium text-live">
              {t("passwordMismatch")}
            </p>
          )}
        </div>

        {error && (
          <p className="text-[13px] font-medium text-live">{t(error)}</p>
        )}

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

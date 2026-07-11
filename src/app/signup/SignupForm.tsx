"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import type { EnabledProviders, OAuthProvider } from "@/lib/auth-providers";
import { signupUser } from "./actions";
import { oauthSignIn } from "./oauth-actions";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-coral/60";

const KakaoMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path
      d="M9 2C5.13 2 2 4.46 2 7.5c0 1.94 1.3 3.64 3.26 4.6-.14.5-.52 1.86-.6 2.15-.09.35.13.35.27.26.1-.07 1.62-1.1 2.28-1.55.25.03.52.05.79.05 3.87 0 7-2.46 7-5.5S12.87 2 9 2z"
      fill="#191600"
    />
  </svg>
);

export function SignupForm({ providers }: { providers: EnabledProviders }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [socialNote, setSocialNote] = useState(false);

  const busy = pending || oauthPending !== null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSocialNote(false);
    startTransition(async () => {
      // On success signupUser throws NEXT_REDIRECT (handled by the framework);
      // it only ever returns on failure.
      const res = await signupUser({ nickname, email, password });
      if (res && !res.ok) setError(res.error);
    });
  }

  function social(provider: OAuthProvider) {
    setError(null);
    setSocialNote(false);
    if (!providers[provider]) {
      // Not configured yet — degrade gracefully instead of a broken redirect.
      setSocialNote(true);
      return;
    }
    setOauthPending(provider);
    startTransition(async () => {
      const res = await oauthSignIn(provider);
      if (res && !res.ok) {
        setSocialNote(true);
        setOauthPending(null);
      }
    });
  }

  return (
    <div>
      {/* Social login — the primary path for Korean users */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => social("kakao")}
          disabled={busy}
          className="relative flex w-full items-center justify-center rounded-[12px] bg-[#FEE500] px-4 py-3 text-[15px] font-bold text-[#191600] transition active:scale-[.99] disabled:opacity-60"
        >
          <span className="absolute left-4">
            <KakaoMark />
          </span>
          {t("kakaoContinue")}
        </button>
        <button
          type="button"
          onClick={() => social("naver")}
          disabled={busy}
          className="relative flex w-full items-center justify-center rounded-[12px] bg-[#03C75A] px-4 py-3 text-[15px] font-bold text-white transition active:scale-[.99] disabled:opacity-60"
        >
          <span className="absolute left-[18px] text-[16px] font-black">N</span>
          {t("naverContinue")}
        </button>
        <button
          type="button"
          onClick={() => social("google")}
          disabled={busy}
          className="relative flex w-full items-center justify-center rounded-[12px] border-[1.5px] border-line-3 bg-white px-4 py-3 text-[15px] font-bold text-ink transition hover:border-line-4 active:scale-[.99] disabled:opacity-60"
        >
          <span className="absolute left-4 text-[16px] font-black text-[#4285F4]">
            G
          </span>
          {t("googleContinue")}
        </button>
      </div>

      {socialNote && (
        <p className="mt-2.5 text-[13px] leading-[1.5] text-muted">
          {t("socialComingSoon")}
        </p>
      )}

      {/* Divider */}
      <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
        <span className="h-px flex-1 bg-line-3" />
        {t("orDivider")}
        <span className="h-px flex-1 bg-line-3" />
      </div>

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
            required
            minLength={4}
            className={inputClass}
          />
        </div>

        {error && (
          <p className="text-[13px] font-medium text-live">{t(error)}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={busy}
          className="mt-1 w-full"
        >
          {pending ? t("signingUp") : t("signupButton")}
        </Button>
      </form>

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
        {t("creatorPrompt")}{" "}
        <Link
          href="/creator/onboarding"
          className="font-semibold text-coral-deep hover:underline"
        >
          {t("goOnboarding")}
        </Link>
      </p>
    </div>
  );
}

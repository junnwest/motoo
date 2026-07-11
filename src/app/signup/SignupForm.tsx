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

export function SignupForm({ providers }: { providers: EnabledProviders }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success signupUser throws NEXT_REDIRECT (handled by the framework);
      // it only ever returns on failure.
      const res = await signupUser({ nickname, email, password });
      if (res && !res.ok) setError(res.error);
    });
  }

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
          disabled={pending}
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
        {t("creatorPrompt")}{" "}
        <Link
          href="/api/become-creator"
          className="font-semibold text-coral-deep hover:underline"
        >
          {t("goOnboarding")}
        </Link>
      </p>
    </div>
  );
}

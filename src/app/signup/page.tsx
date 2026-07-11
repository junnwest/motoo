"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { Button } from "@/components/ui/Button";
import { signupUser } from "./actions";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60";

export default function SignupPage() {
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
    <>
      <Nav variant="fan" />
      <section className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 py-20">
        <div className="rounded-[20px] border border-line-2 bg-card p-8 shadow-[0_10px_40px_rgba(0,0,0,.04)]">
          <div className="mb-6 flex flex-col items-center text-center">
            <Mochi width={40} height={33} float />
            <h1 className="mt-4 text-[24px] font-extrabold tracking-[-0.02em]">
              {t("signupTitle")}
            </h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-body">
              {t("signupSubtitle")}
            </p>
          </div>

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
        </div>

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
      </section>
      <Footer variant="fan" />
    </>
  );
}

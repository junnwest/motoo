"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";
import { Button } from "@/components/ui/Button";
import { loginAction } from "./actions";

export default function LoginPage() {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      // On success loginAction throws NEXT_REDIRECT (handled by the framework);
      // it only ever returns on failure.
      const res = await loginAction(email, password);
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
              {t("loginTitle")}
            </h1>
            <p className="mt-2 text-[15px] leading-[1.6] text-body">
              {t("loginSubtitle")}
            </p>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-[13px] font-semibold text-muted-2"
              >
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-[13px] font-semibold text-muted-2"
              >
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60"
              />
            </div>

            {error && (
              <p className="text-[13px] font-medium text-live">{t("invalid")}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={pending}
              className="mt-1 w-full"
            >
              {pending ? t("loggingIn") : t("loginButton")}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-[14px] text-muted">
          {t("noAccount")}{" "}
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

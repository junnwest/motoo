"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { SocialButtons } from "@/components/SocialButtons";
import type { EnabledProviders } from "@/lib/auth-providers";
import { loginAction } from "./actions";

const labelClass = "mb-1.5 block text-[13px] font-semibold text-muted-2";
const inputClass =
  "w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-coral/60";

export function LoginForm({ providers }: { providers: EnabledProviders }) {
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
    <div>
      <SocialButtons providers={providers} />
      <form onSubmit={submit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
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
  );
}

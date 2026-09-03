"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { SocialButtons } from "@/components/SocialButtons";
import type { EnabledProviders } from "@/lib/auth-providers";
import { loginAction } from "./actions";

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
      const res = await loginAction(email, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Full navigation, not router.push: a soft transition lets Next resolve
      // "/" without requesting it, so the middleware's onboarding gate and the
      // page's own fan/creator routing never run. See login/actions.ts.
      window.location.assign("/");
    });
  }

  return (
    <div>
      <form onSubmit={submit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* The only entry point to account recovery. Under the password field
            rather than below the submit button: it is what someone reaches for
            at the moment the password fails them. */}
        <Link
          href="/forgot"
          className="-mt-1 self-end text-xs font-semibold text-muted hover:text-coral-deep"
        >
          {t("forgotLink")}
        </Link>

        {error && <InlineMessage tone="error">{t(error)}</InlineMessage>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={pending}
        className="mt-1 w-full"
      >
        {pending ? t("loggingIn") : t("loginButton")}
      </Button>
      </form>
      <SocialButtons providers={providers} />
    </div>
  );
}

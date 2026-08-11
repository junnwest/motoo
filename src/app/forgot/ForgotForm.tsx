"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { requestResetAction } from "./actions";

/**
 * Request form. The success state is unconditional — see `requestResetAction`
 * for why the response can't distinguish a known address from an unknown one —
 * so the copy is careful to say "if an account exists" rather than "sent".
 */
export function ForgotForm() {
  const t = useTranslations("auth.reset");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div>
        <h2 className="text-lg font-extrabold text-ink break-keep">
          {t("requestSentTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {t("requestSentBody")}
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block text-sm font-semibold text-coral-deep hover:underline"
        >
          ← {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          await requestResetAction({ email });
          setSent(true);
        });
      }}
    >
      <Input
        type="email"
        required
        autoComplete="email"
        label={t("emailLabel")}
        value={email}
        disabled={pending}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="mt-4 w-full"
        loading={pending}
      >
        {pending ? t("requestSending") : t("requestSubmit")}
      </Button>
    </form>
  );
}

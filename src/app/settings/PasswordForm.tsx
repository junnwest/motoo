"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { changePassword } from "./actions";

export function PasswordForm() {
  const t = useTranslations("settings");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(
    null,
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await changePassword({ currentPassword, newPassword });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
      }
      setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        type="password"
        label={t("currentPasswordLabel")}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
      />

      <Input
        type="password"
        label={t("newPasswordLabel")}
        hint={t("passwordHint")}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <Button
        type="submit"
        variant="secondary"
        size="md"
        disabled={!currentPassword || !newPassword || pending}
        className="self-start"
      >
        {pending ? t("saving") : t("changePassword")}
      </Button>

      {result?.ok && <InlineMessage tone="success">{t("saved")}</InlineMessage>}
      {result?.ok === false && (
        <InlineMessage tone="error">
          {t(`errors.${result.error}` as never)}
        </InlineMessage>
      )}
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
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
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-muted-2">
          {t("currentPasswordLabel")}
        </span>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60"
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-muted-2">
          {t("newPasswordLabel")}
        </span>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-[12px] border border-line-3 bg-white px-4 py-3 text-[15px] outline-none focus:border-coral/60"
        />
        <p className="mt-1.5 text-[12.5px] text-muted">{t("passwordHint")}</p>
      </label>

      <Button
        type="submit"
        variant="secondary"
        size="md"
        disabled={!currentPassword || !newPassword || pending}
        className="self-start"
      >
        {pending ? t("saving") : t("changePassword")}
      </Button>

      {result?.ok && (
        <p className="text-[13.5px] font-semibold text-sage">{t("saved")}</p>
      )}
      {result?.ok === false && (
        <p className="text-[13.5px] font-semibold text-live">
          {t(`errors.${result.error}` as never)}
        </p>
      )}
    </form>
  );
}

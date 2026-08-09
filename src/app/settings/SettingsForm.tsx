"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { checkHandle } from "@/app/onboarding/actions";
import { updateIdentity } from "./actions";

/** Nickname + @handle, with the same live-availability check as onboarding. */
export function IdentityForm({
  initialNickname,
  initialHandle,
}: {
  initialNickname: string;
  initialHandle: string;
}) {
  const t = useTranslations("settings");
  const [nickname, setNickname] = useState(initialNickname);
  const [handle, setHandle] = useState(initialHandle);
  const [handleStatus, setHandleStatus] = useState<
    "idle" | "checking" | "ok" | "taken" | "invalid"
  >("idle");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(
    null,
  );

  useEffect(() => {
    const h = handle.trim().toLowerCase();
    // All setState calls are deferred into the timer callback (never
    // synchronously in the effect body itself), including the "unchanged"
    // case — avoids the cascading-render anti-pattern react-hooks flags.
    const timer = setTimeout(async () => {
      if (h === initialHandle) {
        setHandleStatus("idle"); // unchanged — no need to re-check your own handle
        return;
      }
      setHandleStatus("checking");
      const res = await checkHandle(h);
      setHandleStatus(res.available ? "ok" : (res.reason ?? "invalid"));
    }, 350);
    return () => clearTimeout(timer);
  }, [handle, initialHandle]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateIdentity({ nickname, handle });
      setResult(res.ok ? { ok: true } : { ok: false, error: res.error });
    });
  }

  const canSubmit =
    nickname.trim().length > 0 &&
    (handle === initialHandle || handleStatus === "ok");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        label={t("nicknameLabel")}
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={40}
      />

      {/* The @ prefix lives inside the border, so this one keeps its own
          bordered wrapper and uses Field only for the label/status wiring —
          `Input` owns the border and can't host a sibling inside it. */}
      <Field label={t("handleLabel")}>
        {(a11y) => (
          <>
            <div className="flex items-center gap-2 rounded-md border border-line-3 bg-white px-4 py-3 transition focus-within:border-coral/60">
              <span className="text-base text-muted">@</span>
              <input
                {...a11y}
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                maxLength={20}
                className="w-full text-base outline-none"
              />
            </div>
            {handle !== initialHandle && (
              <p
                role="status"
                className={`mt-1.5 text-xs font-medium ${
                  handleStatus === "ok" ? "text-sage" : "text-muted"
                }`}
              >
                {handleStatus === "checking" && t("handleChecking")}
                {handleStatus === "ok" && t("handleAvailable")}
                {handleStatus === "taken" && t("handleTaken")}
                {handleStatus === "invalid" && t("handleInvalid")}
              </p>
            )}
          </>
        )}
      </Field>

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={!canSubmit || pending}
        className="self-start"
      >
        {pending ? t("saving") : t("save")}
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

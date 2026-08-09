"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field, Input } from "@/components/ui/Field";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { checkHandle, verifyIdentity, completeOnboarding } from "./actions";

type HandleState = "idle" | "checking" | "available" | "taken" | "invalid";

export function OnboardingForm({
  defaultNickname,
  alreadyVerified,
}: {
  defaultNickname: string;
  alreadyVerified: boolean;
}) {
  const t = useTranslations("onboarding");
  const [nickname, setNickname] = useState(defaultNickname);
  const [handle, setHandle] = useState("");
  const [handleState, setHandleState] = useState<HandleState>("idle");
  const [verified, setVerified] = useState(alreadyVerified);
  const [verifyPending, startVerify] = useTransition();
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitPending, startSubmit] = useTransition();

  // Debounced handle availability check.
  //
  // Every setState is deferred into the timer callback rather than run in the
  // effect body. Setting state synchronously there cascades an extra render on
  // each keystroke, which is what `react-hooks/set-state-in-effect` flags — the
  // same rewrite `usePersistedCollapse`, `FollowButton` and /settings' own
  // handle field already had. This was the last remaining instance, and the
  // longest-standing lint error in the repo.
  useEffect(() => {
    const h = handle.trim().toLowerCase();
    const timer = setTimeout(async () => {
      if (!h) return setHandleState("idle");
      if (!/^[a-z0-9_]{2,20}$/.test(h)) return setHandleState("invalid");
      setHandleState("checking");
      const res = await checkHandle(h);
      setHandleState(
        res.available ? "available" : res.reason === "taken" ? "taken" : "invalid",
      );
    }, 400);
    return () => clearTimeout(timer);
  }, [handle]);

  function verify() {
    setError(null);
    startVerify(async () => {
      const res = await verifyIdentity();
      if (res.ok) setVerified(true);
      else setError("generic");
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nickname.trim()) return setError("nicknameRequired");
    if (handleState !== "available") return setError("handleRequired");
    if (!verified) return setError("verifyRequired");
    if (!agreedTerms) return setError("termsRequired");
    startSubmit(async () => {
      const res = await completeOnboarding({
        nickname: nickname.trim(),
        handle: handle.trim().toLowerCase(),
        marketingConsent: marketing,
        agreedTerms,
      });
      if (res && !res.ok) setError(res.error);
      // on success the action redirects server-side
    });
  }

  const canSubmit =
    !!nickname.trim() &&
    handleState === "available" &&
    verified &&
    agreedTerms &&
    !submitPending;

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-7 rounded-2xl border border-line-2 bg-card p-7 sm:p-8"
    >
      {/* Profile */}
      <section className="flex flex-col gap-4">
        <Eyebrow>{t("sectionProfile")}</Eyebrow>
        <Input
          label={t("nickname")}
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t("nicknamePlaceholder")}
          maxLength={40}
        />
        {/* The @ prefix sits inside the border, so this keeps its own wrapper
            and uses Field only for the label + id wiring (same as /settings). */}
        <Field label={t("handle")}>
          {(a11y) => (
          <>
          <div className="flex items-center rounded-md border border-line-3 bg-white pl-3 transition focus-within:border-coral/60">
            <span className="text-base text-muted">@</span>
            <input
              {...a11y}
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder={t("handlePlaceholder")}
              maxLength={20}
              autoCapitalize="none"
              className="w-full bg-transparent px-2 py-3 text-base outline-none"
            />
          </div>
          <p
            role="status"
            className={`mt-1.5 text-xs ${
              handleState === "available"
                ? "text-sage"
                : handleState === "taken" || handleState === "invalid"
                  ? "text-live"
                  : "text-muted"
            }`}
          >
            {handleState === "checking"
              ? t("handleChecking")
              : handleState === "available"
                ? `✓ ${t("handleAvailable")}`
                : handleState === "taken"
                  ? t("handleTaken")
                  : handleState === "invalid"
                    ? t("handleInvalid")
                    : t("handleHint")}
          </p>
          </>
          )}
        </Field>
      </section>

      {/* Identity verification */}
      <section className="flex flex-col gap-3">
        <Eyebrow>{t("sectionVerify")}</Eyebrow>
        {verified ? (
          <div className="flex items-center gap-2 rounded-lg bg-sage-bg px-4 py-3 text-sm font-semibold text-sage">
            <span>✓</span>
            {t("verifiedLabel")} · {t("verifiedAdult")}
          </div>
        ) : (
          <>
            <p className="text-sm text-body">{t("verifySubtitle")}</p>
            <Button
              type="button"
              variant="dark"
              size="md"
              disabled={verifyPending}
              onClick={verify}
              className="w-full"
            >
              {verifyPending ? t("verifying") : t("verifyButton")}
            </Button>
            <p className="text-2xs leading-normal text-muted">
              {t("verifyDemoNote")}
            </p>
          </>
        )}
      </section>

      {/* Terms */}
      <section className="flex flex-col gap-3">
        <Eyebrow>{t("sectionTerms")}</Eyebrow>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={agreedTerms}
            onChange={(e) => setAgreedTerms(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-line-3 accent-coral"
          />
          <span>
            {t.rich("termsRequired", {
              a: (c) => (
                <Link href="/terms" className="font-semibold text-coral-deep underline">
                  {c}
                </Link>
              ),
              b: (c) => (
                <Link href="/privacy" className="font-semibold text-coral-deep underline">
                  {c}
                </Link>
              ),
            })}
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-body">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-sm border border-line-3 accent-coral"
          />
          <span>{t("marketingOptional")}</span>
        </label>
      </section>

      {error && (
        <InlineMessage tone="error">{t(`errors.${error}`)}</InlineMessage>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={!canSubmit}
        className="w-full"
      >
        {submitPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

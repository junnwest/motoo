"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mochi } from "./Mochi";

/**
 * Sign-up role chooser. A single 회원가입 entry opens this instead of forking the
 * CTA into two: the user picks 후원자 (support) → /signup or 크리에이터 (create) →
 * /api/become-creator (the combined signup → onboarding → Studio-setup flow).
 * Closes on backdrop click, Escape, or picking a card.
 */
export function SignupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("auth");
  const cardRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Portal to <body>: the nav header uses backdrop-blur, which creates a
  // containing block that would otherwise anchor this `fixed` overlay to the
  // header instead of the viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="signup-modal-title"
    >
      <button
        type="button"
        aria-label={t("close")}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />

      <div className="relative w-full max-w-[460px] rounded-[24px] border border-line-2 bg-card p-7 shadow-[0_24px_70px_rgba(33,28,24,0.28)] sm:p-9">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-cream-warm hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center">
          <h2
            id="signup-modal-title"
            className="text-[24px] font-extrabold tracking-[-0.02em] text-ink"
          >
            {t("signupTitle")}
          </h2>
          <p className="mt-1 text-[14px] text-muted">
            {t("signupModalSubtitle")}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3.5">
          {/* Supporter */}
          <Link
            ref={cardRef}
            href="/signup"
            onClick={onClose}
            className="group flex flex-col items-center rounded-[18px] border border-line-2 bg-panel px-4 py-6 text-center transition hover:border-coral hover:bg-card hover:shadow-[0_8px_24px_rgba(33,28,24,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-coral-chip text-coral-deep transition group-hover:bg-coral group-hover:text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 1.9 5 5.1 5c2 0 3.3 1.2 3.9 2.2C9.6 6.2 10.9 5 12.9 5 16.1 5 17.6 8.4 16 11.7 13.5 16.4 12 21 12 21z" />
              </svg>
            </span>
            <span className="mt-4 text-[12.5px] text-muted">
              {t("roleFanTagline")}
            </span>
            <span className="mt-0.5 text-[16px] font-extrabold text-ink">
              {t("roleFan")}
            </span>
          </Link>

          {/* Creator */}
          <Link
            href="/api/become-creator"
            onClick={onClose}
            className="group flex flex-col items-center rounded-[18px] border border-line-2 bg-panel px-4 py-6 text-center transition hover:border-coral hover:bg-card hover:shadow-[0_8px_24px_rgba(33,28,24,0.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-sage-bg transition group-hover:bg-sage/20">
              <Mochi width={26} height={21} />
            </span>
            <span className="mt-4 text-[12.5px] text-muted">
              {t("roleCreatorTagline")}
            </span>
            <span className="mt-0.5 text-[16px] font-extrabold text-ink">
              {t("roleCreator")}
            </span>
          </Link>
        </div>

        <p className="mt-6 text-center text-[13.5px] text-muted">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            onClick={onClose}
            className="font-semibold text-coral-deep hover:underline"
          >
            {t("goLogin")}
          </Link>
        </p>
      </div>
    </div>,
    document.body,
  );
}

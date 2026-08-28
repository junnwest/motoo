"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Mochi } from "./Mochi";
import { IconHeart } from "@/components/ui/Icons";

/**
 * Sign-up role chooser. A single 회원가입 entry opens this instead of forking the
 * CTA into two: the user picks 후원자 (support) → /api/fan-signup or 크리에이터
 * (create) → /api/become-creator (the combined signup → onboarding →
 * Studio-setup flow). Both go through a route handler rather than straight to
 * /signup so the choice actually *sets* the creator intent one way or the other
 * — otherwise a stale cookie from an earlier 크리에이터 click would silently
 * append creator onboarding to a fan signup.
 * Closes on backdrop click, Escape, or picking a card.
 *
 * The portal / Escape / scroll-lock / close-button machinery used to be
 * duplicated here — this component predates `ui/Modal`, which was extracted
 * from it. It now composes that instead, so there is one implementation of the
 * dialog shell (and, in particular, one place for the focus handling Stage 3
 * hardens).
 */
export function SignupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("auth");

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="signup-modal-title"
      closeLabel={t("close")}
      // The role chooser is wider than the shell's 420px default and carries
      // its own roomier padding.
      className="!max-w-[460px] p-7 sm:p-9"
    >
        <div className="text-center">
          <h2
            id="signup-modal-title"
            className="text-2xl font-extrabold tracking-[-0.02em] text-ink"
          >
            {t("signupTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t("signupModalSubtitle")}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3.5">
          {/* Supporter */}
          <Link
            href="/api/fan-signup"
            onClick={onClose}
            className="group flex flex-col items-center rounded-xl border border-line-2 bg-panel px-4 py-6 text-center transition hover:border-coral hover:bg-card hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-line-2 bg-card text-coral-deep transition group-hover:border-coral group-hover:shadow-soft">
              {/* Was a hand-rolled filled heart inline here. It was the only
                  glyph in the app not coming from `Icons.tsx`, and it had
                  drifted accordingly: solid where everything else is a 2px
                  stroke, and geometrically lopsided — its lobes spanned
                  x≈1.5–17 while the bottom point sat at x=12, so it rendered
                  visibly left of centre in this tile. */}
              <IconHeart className="h-6 w-6" />
            </span>
            <span className="mt-4 text-xs text-muted">
              {t("roleFanTagline")}
            </span>
            <span className="mt-0.5 text-base font-extrabold text-ink">
              {t("roleFan")}
            </span>
          </Link>

          {/* Creator */}
          <Link
            href="/api/become-creator"
            onClick={onClose}
            className="group flex flex-col items-center rounded-xl border border-line-2 bg-panel px-4 py-6 text-center transition hover:border-coral hover:bg-card hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-line-2 bg-card transition group-hover:border-coral group-hover:shadow-soft">
              <Mochi width={26} height={21} />
            </span>
            <span className="mt-4 text-xs text-muted">
              {t("roleCreatorTagline")}
            </span>
            <span className="mt-0.5 text-base font-extrabold text-ink">
              {t("roleCreator")}
            </span>
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {t("haveAccount")}{" "}
          <Link
            href="/login"
            onClick={onClose}
            className="font-semibold text-coral-deep hover:underline"
          >
            {t("goLogin")}
          </Link>
        </p>
    </Modal>
  );
}

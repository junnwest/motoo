"use client";

import { useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { ButtonLink, Button } from "@/components/ui/Button";
import { IconStudio } from "@/components/ui/Icons";

// whitespace-nowrap: at 375px the header ran out of room and "스튜디오" wrapped
// mid-word inside the pill, breaking it across two lines.
const PILL_CLASS =
  "ml-1 flex items-center gap-2 whitespace-nowrap rounded-full border border-line-3 bg-white px-3 py-2.5 text-[14px] font-bold text-ink transition-colors hover:border-coral hover:text-coral-deep sm:ml-2 sm:px-4";

/**
 * The nav's 스튜디오 pill.
 *
 * A creator goes straight to their console. A **fan used to be dropped
 * directly into `/creator/onboarding`** — a full setup form, with no
 * explanation of why clicking "스튜디오" produced one. It read as a bug: the
 * button names a place, then hands you a form for a thing you didn't ask to
 * become. So for non-creators the pill now opens a short modal that says
 * plainly that the Studio needs a creator account, and offers registering as
 * the deliberate next step.
 *
 * Scoped to this pill on purpose. The explicit creator entry points — the
 * landing's 크리에이터로 시작하기, `/creators`, the signup role modal — already
 * state the intent in the label, so gating those behind a confirmation would be
 * friction, not clarity. They keep going straight to `/api/become-creator`.
 */
export function StudioPill({
  studioHandle,
  label,
  gate,
}: {
  /** The account's Studio handle, or null for a fan. */
  studioHandle: string | null;
  label: string;
  gate: {
    title: string;
    body: string;
    confirm: string;
    cancel: string;
    close: string;
  };
}) {
  const [open, setOpen] = useState(false);

  if (studioHandle) {
    return (
      <Link href="/studio" className={PILL_CLASS}>
        <IconStudio width={20} height={20} />
        {label}
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={PILL_CLASS}
      >
        <IconStudio width={20} height={20} />
        {label}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        titleId="studio-gate-title"
        closeLabel={gate.close}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-coral-chip text-coral-deep">
          <IconStudio width={24} height={24} />
        </span>
        <h2
          id="studio-gate-title"
          className="mt-4 text-[20px] font-extrabold tracking-[-0.02em] text-ink"
        >
          {gate.title}
        </h2>
        <p className="mt-2 text-[14.5px] leading-[1.6] text-body">{gate.body}</p>

        <div className="mt-6 flex flex-col gap-2">
          <ButtonLink
            href="/api/become-creator"
            variant="primary"
            size="md"
            className="w-full justify-center"
          >
            {gate.confirm}
          </ButtonLink>
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => setOpen(false)}
            className="w-full justify-center"
          >
            {gate.cancel}
          </Button>
        </div>
      </Modal>
    </>
  );
}

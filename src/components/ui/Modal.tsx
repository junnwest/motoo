"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Shared modal shell: backdrop, centered card, close button, and the three
 * dismissals users expect (backdrop click, Escape, the ✕).
 *
 * **Portal to `document.body` is load-bearing, not a preference.** The nav
 * header uses `backdrop-blur`, which creates a containing block — a `fixed`
 * overlay rendered inside it anchors to the header instead of the viewport.
 * `SignupModal` learned this the hard way (DECISIONS 2026-07-24); this
 * component exists so the next modal doesn't have to.
 *
 * Takes `closeLabel` as a prop rather than reaching for next-intl, so it stays
 * usable from any client component regardless of which namespace it's in.
 */
export function Modal({
  open,
  onClose,
  titleId,
  closeLabel,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  /** id of the element labelling this dialog, for aria-labelledby. */
  titleId: string;
  closeLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

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

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />

      <div
        ref={cardRef}
        tabIndex={-1}
        className={`relative w-full max-w-[420px] rounded-[24px] border border-line-2 bg-card p-7 shadow-[0_24px_70px_rgba(33,28,24,0.28)] outline-none sm:p-8 ${className}`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-cream-warm hover:text-ink"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}

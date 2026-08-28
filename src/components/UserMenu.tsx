"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CreatorBadge } from "./CreatorBadge";

export type MenuItem = { label: string; href: string };

/**
 * Avatar + click-to-open account dropdown. The only interactive cluster on the
 * right of the nav: the user's profile picture (or an initials monogram when
 * they haven't set one) toggling a menu holding every link (Explore, My mochi,
 * Studio/become-creator or Studio settings, …) plus logout. Closes on
 * outside-click, Escape, or selecting an item.
 */
export function UserMenu({
  name,
  initial,
  avatarUrl,
  subtitle,
  creatorLabel,
  items,
  logoutLabel,
}: {
  name: string;
  initial: string;
  avatarUrl?: string | null;
  subtitle?: string;
  /** "크리에이터 등록 완료" — passed only when this account owns a Studio. */
  creatorLabel?: string;
  items: MenuItem[];
  logoutLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={name}
        className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white shadow-sm ring-1 ring-black/5 transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep ${
          avatarUrl ? "bg-sand" : "bg-coral"
        }`}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 overflow-hidden rounded-2xl border border-line-2 bg-card shadow-float"
        >
          <div className="border-b border-line px-4 py-3">
            <div className="truncate text-sm font-bold text-ink">{name}</div>
            {subtitle && (
              <div className="truncate text-2xs text-muted">{subtitle}</div>
            )}
            {creatorLabel && (
              <CreatorBadge label={creatorLabel} size="sm" className="mt-1.5" />
            )}
          </div>

          <div className="py-1.5">
            {items.map((it) => (
              <Link
                key={`${it.href}:${it.label}`}
                href={it.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-ink transition hover:bg-cream-warm"
              >
                {it.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-line py-1.5">
            {/* A native POST to a route handler, NOT a server action: a server
                action logout finishes as a client-side transition, leaving the
                current document's in-flight RSC fetches alive across the
                sign-out — and one landing afterwards re-planted the session
                cookie. A real navigation cancels them. See src/app/api/logout. */}
            <form action="/api/logout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="block w-full px-4 py-2 text-left text-sm font-medium text-coral-deep transition hover:bg-cream-warm"
              >
                {logoutLabel}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

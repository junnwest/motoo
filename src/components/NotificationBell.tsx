"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconBell } from "@/components/ui/Icons";
import { markRead } from "@/app/notifications/actions";

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string; // pre-serialized (Date isn't a valid Server->Client prop as-is here)
};

/**
 * Bell + unread badge, mirroring UserMenu's click-to-open dropdown (same
 * outside-click/Escape handling). Shows the latest few; "전체 보기" hands off to
 * the full /notifications page. Server-fetched data is passed in as props —
 * this component only owns open/closed state and the read-on-click mutation.
 */
export function NotificationBell({
  items,
  unreadCount,
  seeAllLabel,
  emptyLabel,
}: {
  items: NotificationRow[];
  unreadCount: number;
  seeAllLabel: string;
  emptyLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  async function onSelect(row: NotificationRow) {
    setOpen(false);
    if (!row.read) await markRead(row.id);
    if (row.link) router.push(row.link);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={seeAllLabel}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"
      >
        <IconBell width={19} height={19} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border border-line-2 bg-card shadow-[0_16px_40px_rgba(33,28,24,0.14)]"
        >
          {items.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13.5px] text-muted">
              {emptyLabel}
            </div>
          ) : (
            <ul className="max-h-[360px] overflow-y-auto py-1.5">
              {items.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => onSelect(row)}
                    className="flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-cream-warm"
                  >
                    {!row.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-coral" />
                    )}
                    <span className={`min-w-0 flex-1 ${row.read ? "pl-4" : ""}`}>
                      <span className="block truncate text-[13.5px] font-bold text-ink">
                        {row.title}
                      </span>
                      {row.body && (
                        <span className="block truncate text-[12.5px] text-muted">
                          {row.body}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line py-1.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-[13.5px] font-bold text-coral-deep hover:bg-cream-warm"
            >
              {seeAllLabel} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { markAllRead, markRead } from "./actions";
import { formatKstDate } from "@/lib/format";

type Row = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

/**
 * The notification list + mark-all-read control. Client so a click can
 * optimistically mark a row read without waiting on a full page reload.
 */
export function NotificationList({
  initialRows,
  hasUnread,
  markAllLabel,
  emptyLabel,
}: {
  initialRows: Row[];
  hasUnread: boolean;
  markAllLabel: string;
  emptyLabel: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [pending, startTransition] = useTransition();

  function onMarkAll() {
    setRows((prev) => prev.map((r) => ({ ...r, read: true }))); // optimistic
    startTransition(() => {
      void markAllRead();
    });
  }

  function onSelect(row: Row) {
    if (row.read) return;
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, read: true } : r)),
    );
    startTransition(() => {
      void markRead(row.id);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="mt-10 rounded-xl border border-dashed border-line-3 bg-cream-warm/50 px-6 py-16 text-center text-base text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <>
      {hasUnread && (
        <button
          type="button"
          onClick={onMarkAll}
          disabled={pending}
          className="mt-4 text-sm font-bold text-coral-deep hover:underline disabled:opacity-60"
        >
          {markAllLabel}
        </button>
      )}

      <ul className="mt-4 flex flex-col gap-2.5">
        {rows.map((row) => {
          const content = (
            <div
              className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
                row.read
                  ? "border-line-2 bg-card"
                  : "border-coral/30 bg-coral-chip/30"
              }`}
            >
              {!row.read && (
                <span className="mt-1.5 h-2 w-2 flex-none rounded-full bg-coral" />
              )}
              <span className={`min-w-0 flex-1 ${row.read ? "pl-5" : ""}`}>
                <span className="block text-base font-bold text-ink">
                  {row.title}
                </span>
                {row.body && (
                  <span className="mt-0.5 block text-sm text-body">
                    {row.body}
                  </span>
                )}
                <span className="mt-1.5 block text-2xs text-muted">
                  {formatKstDate(new Date(row.createdAt))}
                </span>
              </span>
            </div>
          );

          return (
            <li key={row.id}>
              {row.link ? (
                <Link href={row.link} onClick={() => onSelect(row)}>
                  {content}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(row)}
                  className="w-full text-left"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

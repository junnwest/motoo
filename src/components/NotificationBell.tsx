import Link from "next/link";
import { IconBell } from "@/components/ui/Icons";

/**
 * A plain icon-link to /notifications with an unread badge — no dropdown.
 * Matches the ranking icon's behavior exactly (DECISIONS 2026-07-30): both are
 * "click through to a dedicated page," not a preview surface. Needs no client
 * JS, unlike the avatar dropdown, which has to open in place.
 */
export function NotificationBell({
  unreadCount,
  label,
}: {
  unreadCount: number;
  label: string;
}) {
  return (
    <Link
      href="/notifications"
      aria-label={label}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-cream-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-deep"
    >
      <IconBell width={23} height={23} />
      {unreadCount > 0 && (
        <span className="absolute right-0 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-coral px-1 text-[10.5px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

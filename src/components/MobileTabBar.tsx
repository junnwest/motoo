"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBell,
  IconCompass,
  IconHome,
  IconUsers,
} from "@/components/ui/Icons";

/**
 * Primary navigation below `lg`, where the app previously had none.
 *
 * The Sidebar is `hidden lg:block` and the RightRail `hidden xl:block`, so on a
 * phone the entire left rail — 홈, 둘러보기, and the following list — simply
 * wasn't rendered. The header carries only the brand, a ranking icon, a bell,
 * the Studio pill and the avatar, and the avatar dropdown is identity-only. The
 * result: **the only route to /explore on a phone was a link at the bottom of
 * the footer.** For a Korean creator-economy product, where traffic is
 * overwhelmingly mobile, that's the discovery surface being effectively
 * unreachable for most users.
 *
 * A bottom tab bar rather than a hamburger: these four are peer destinations
 * users switch between constantly, which is exactly what a tab bar is for, and
 * it keeps them one thumb-tap away instead of behind a menu. It mirrors what
 * every Korean mobile app in this category does, and it costs no vertical space
 * in the header.
 *
 * Hidden from `lg` up, where the Sidebar takes over — the two never coexist.
 */

const TABS = [
  { href: "/home", icon: IconHome, key: "home" },
  { href: "/explore", icon: IconCompass, key: "explore" },
  { href: "/notifications", icon: IconBell, key: "notifications" },
  { href: "/profile", icon: IconUsers, key: "profile" },
] as const;

export function MobileTabBar({
  labels,
  unreadCount,
}: {
  /** Keyed by tab, so this stays usable from a server component's translations. */
  labels: Record<(typeof TABS)[number]["key"], string>;
  unreadCount: number;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={labels.home}
      // `pb-[env(safe-area-inset-bottom)]` keeps the row clear of the iOS home
      // indicator; without it the last few pixels of each tap target sit under
      // the system gesture area.
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          const active =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <li key={tab.key} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                // min-h-[56px] keeps every tap target comfortably past the 44px
                // floor WCAG 2.5.8 asks for.
                className={`relative flex min-h-[56px] flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                  active ? "text-coral-deep" : "text-muted"
                }`}
              >
                <span className="relative">
                  <Icon width={22} height={22} />
                  {tab.key === "notifications" && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {labels[tab.key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

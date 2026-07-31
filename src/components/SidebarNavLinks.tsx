"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCompass, IconHome } from "@/components/ui/Icons";

/**
 * The Sidebar's top-level 홈/둘러보기 links — split into their own client
 * component because active-page detection needs `usePathname()`, which isn't
 * available in `Sidebar` (an async server component fetching the following
 * list). `/explore` matches its own filtered subroutes too (still the same
 * page), `/home` is exact since nothing nests under it.
 */
export function SidebarNavLinks({
  homeLabel,
  exploreLabel,
}: {
  homeLabel: string;
  exploreLabel: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      <SidebarLink
        href="/home"
        active={pathname === "/home"}
        icon={<IconHome width={22} height={22} />}
      >
        {homeLabel}
      </SidebarLink>
      <SidebarLink
        href="/explore"
        active={pathname.startsWith("/explore")}
        icon={<IconCompass width={22} height={22} />}
      >
        {exploreLabel}
      </SidebarLink>
    </nav>
  );
}

function SidebarLink({
  href,
  icon,
  active,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-bold transition-colors ${
        active
          ? "bg-cream-warm text-coral-deep"
          : "text-ink hover:bg-cream-warm"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

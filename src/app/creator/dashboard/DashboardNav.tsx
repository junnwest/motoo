"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Labels = {
  home: string;
  mochi: string;
  items: string;
  orders: string;
};

export function DashboardNav({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  const links = [
    { href: "/creator/dashboard", label: labels.home },
    { href: "/creator/dashboard/mochi", label: labels.mochi },
    { href: "/creator/dashboard/items", label: labels.items },
    { href: "/creator/dashboard/orders", label: labels.orders },
  ];

  return (
    <nav className="flex flex-row gap-1 md:flex-col">
      {links.map((link) => {
        // Home matches exactly; sub-pages match on prefix.
        const active =
          link.href === "/creator/dashboard"
            ? pathname === link.href
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-[12px] px-4 py-2.5 text-[15px] font-semibold transition-colors ${
              active
                ? "bg-ink text-cream"
                : "text-body hover:bg-black/[.04]"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

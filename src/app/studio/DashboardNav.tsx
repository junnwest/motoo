"use client";

import { useEffect, useState } from "react";

type Labels = {
  home: string;
  mochi: string;
  items: string;
  orders: string;
};

// Sidebar entries jump to sections on the single-page dashboard. `key` maps to
// the label; `id` matches the section's DOM id in page.tsx.
const SECTIONS = [
  { id: "overview", key: "home" },
  { id: "mochi", key: "mochi" },
  { id: "items", key: "items" },
  { id: "orders", key: "orders" },
] as const;

export function DashboardNav({ labels }: { labels: Labels }) {
  const [active, setActive] = useState<string>("overview");

  // Scrollspy: highlight the section currently near the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="flex flex-row gap-1 md:flex-col">
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={active === s.id ? "page" : undefined}
          className={`rounded-[12px] px-4 py-2.5 text-[15px] font-semibold transition-colors ${
            active === s.id
              ? "bg-ink text-cream"
              : "text-body hover:bg-black/[.04]"
          }`}
        >
          {labels[s.key]}
        </a>
      ))}
    </nav>
  );
}

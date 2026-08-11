"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { CreatorCover } from "@/components/CreatorCover";
import {
  IconChevronLeft,
  IconChevronRight,
  IconCompass,
  IconHome,
} from "@/components/ui/Icons";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";
import { usePersistedCollapse } from "@/lib/usePersistedCollapse";

const STORAGE_KEY = "motoo:sidebarCollapsed";

/**
 * The Sidebar's client half — collapse state and active-page detection both
 * need client hooks (`localStorage`, `usePathname()`), which `Sidebar` (an
 * async server component fetching the following list) can't use.
 *
 * Same collapse mechanic as `RightRailPanel`, mirrored to this side
 * (DECISIONS 2026-07-31): the fold button sits before "팔로잉", hidden until
 * the sidebar is hovered, then grows in and pushes the label right. Collapsed
 * state shrinks the whole sidebar (nav links included) to a thin strip
 * holding just the reopen button, on the left edge the sidebar itself sits
 * on.
 */
export function SidebarPanel({
  following,
}: {
  following: {
    streamerId: string;
    handle: string;
    displayName: string;
    category: string;
  }[];
}) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const tn = useTranslations("nav");
  const tc = useTranslations("common");
  const tax = useTranslations("creatorTaxonomy");
  const [collapsed, toggle] = usePersistedCollapse(STORAGE_KEY);

  if (collapsed) {
    return (
      <aside className="hidden h-full w-12 flex-none rounded-xl border border-line-2 bg-panel py-6 lg:block">
        <button
          type="button"
          onClick={() => toggle(false)}
          aria-label={tc("expand")}
          className="mx-auto flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-warm hover:text-ink"
        >
          <IconChevronRight width={18} height={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="group hidden h-full w-[224px] flex-none overflow-y-auto rounded-xl border border-line-2 bg-panel px-3 py-6 lg:block">
      <nav className="flex flex-col gap-0.5">
        <SidebarLink
          href="/home"
          active={pathname === "/home"}
          icon={<IconHome width={22} height={22} />}
        >
          {tn("home")}
        </SidebarLink>
        <SidebarLink
          href="/explore"
          active={pathname.startsWith("/explore")}
          icon={<IconCompass width={22} height={22} />}
        >
          {tn("explore")}
        </SidebarLink>
      </nav>

      <div className="mb-2 mt-6 flex items-center gap-1 px-3">
        <button
          type="button"
          onClick={() => toggle(true)}
          aria-label={tc("collapse")}
          className="flex h-6 w-0 flex-none items-center justify-center overflow-hidden rounded-full text-muted opacity-0 transition-all duration-150 group-hover:mr-1 group-hover:w-6 group-hover:opacity-100 hover:bg-cream-warm hover:text-ink"
        >
          <IconChevronLeft width={14} height={14} />
        </button>
        <span className="text-2xs font-bold uppercase tracking-[0.08em] text-muted">
          {t("followingTitle")}
        </span>
      </div>

      {following.length === 0 ? (
        <p className="px-3 text-xs leading-relaxed text-muted">
          {t("followingEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {following.map((c) => (
            <li key={c.streamerId}>
              <Link
                href={`/s/${c.handle}`}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 transition-colors hover:bg-cream-warm"
              >
                <CreatorCover
                  handle={c.handle}
                  displayName={c.displayName}
                  className="h-7 w-7 flex-none rounded-full"
                  markClass="text-2xs"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {c.displayName}
                  </span>
                  <span className="block truncate text-2xs text-muted">
                    {ALL_CATEGORIES.includes(c.category)
                      ? tax(`categories.${c.category}`)
                      : c.category}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </aside>
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
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-bold transition-colors ${
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

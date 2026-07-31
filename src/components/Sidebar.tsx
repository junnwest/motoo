import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CreatorCover } from "@/components/CreatorCover";
import { IconCompass, IconHome } from "@/components/ui/Icons";
import { getFollowList } from "@/lib/follows";
import { ALL_CATEGORIES } from "@/lib/creatorTaxonomy";

/**
 * The persistent left sidebar (DECISIONS 2026-07-30) — a real app frame, not a
 * home-page widget, so it has to keep existing while you navigate: 홈/둘러보기
 * at top, then the following list below. Rendered by ConsumerShell on every
 * signed-in consumer page; never on the Studio host or while signed out.
 *
 * The following list is strictly Follow rows (never merged with
 * MochiHolding) — see src/lib/follows.ts.
 */
export async function Sidebar({ backerId }: { backerId: string }) {
  const t = await getTranslations("sidebar");
  const tn = await getTranslations("nav");
  const tax = await getTranslations("creatorTaxonomy");
  const following = await getFollowList(backerId);

  return (
    <aside className="sticky top-16 hidden max-h-[calc(100vh-64px)] w-[260px] flex-none overflow-y-auto border-r border-line px-3 py-6 lg:block">
      <nav className="flex flex-col gap-0.5">
        <SidebarLink href="/home" icon={<IconHome width={18} height={18} />}>
          {tn("home")}
        </SidebarLink>
        <SidebarLink href="/explore" icon={<IconCompass width={18} height={18} />}>
          {tn("explore")}
        </SidebarLink>
      </nav>

      <div className="mb-2 mt-6 px-3 text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
        {t("followingTitle")}
      </div>

      {following.length === 0 ? (
        <p className="px-3 text-[13px] leading-relaxed text-muted">
          {t("followingEmpty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {following.map((c) => (
            <li key={c.streamerId}>
              <Link
                href={`/s/${c.handle}`}
                className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 transition-colors hover:bg-panel"
              >
                <CreatorCover
                  handle={c.handle}
                  displayName={c.displayName}
                  className="h-7 w-7 flex-none rounded-full"
                  markClass="text-[12px]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">
                    {c.displayName}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
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
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14.5px] font-bold text-ink transition-colors hover:bg-panel"
    >
      {icon}
      {children}
    </Link>
  );
}

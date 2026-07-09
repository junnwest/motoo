import { useTranslations } from "next-intl";
import type { BackingDisplay } from "@prisma/client";
import { formatFoundingNumber } from "@/lib/format";

export interface WallEntry {
  id: string;
  foundingNumber: number;
  display: BackingDisplay;
  displayName: string | null;
  message: string | null;
  backer: { nickname: string };
  tier: { name: string };
}

/**
 * The Backer Wall — the emotional heart of the product. Rendered as a semantic
 * list (quality floor §10). Shows founding numbers, chosen display name or an
 * anonymous placeholder, and optional messages.
 */
export function BackerWall({ entries }: { entries: WallEntry[] }) {
  const t = useTranslations("profile");

  if (entries.length === 0) {
    return (
      <p className="rounded-[16px] border border-dashed border-line-3 bg-cream-warm/50 px-6 py-10 text-center text-[15px] text-body">
        {t("backerWallEmpty")}
      </p>
    );
  }

  function nameFor(e: WallEntry): string {
    if (e.display === "anonymous") return t("anonymousBacker");
    if (e.display === "nickname" && e.displayName) return e.displayName;
    return e.backer.nickname;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex gap-3 rounded-[16px] border border-line-2 bg-card p-4"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-coral-chip font-mono text-[13px] font-bold text-coral-deep">
            {formatFoundingNumber(e.foundingNumber)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`truncate text-[15px] font-bold ${
                  e.display === "anonymous" ? "text-muted" : "text-ink"
                }`}
              >
                {nameFor(e)}
              </span>
              <span className="flex-none rounded-full bg-panel px-2 py-[2px] text-[11px] text-muted">
                {t("foundingLabel")}
              </span>
            </div>
            {e.message && (
              <p className="mt-1 line-clamp-2 text-[13.5px] leading-[1.5] text-body">
                “{e.message}”
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

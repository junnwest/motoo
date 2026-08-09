import Link from "next/link";
import { useTranslations } from "next-intl";
import type { StreamerCard as StreamerCardData } from "@/lib/streamers";
import { Avatar } from "./ui/Placeholder";
import { CreatorCover } from "./CreatorCover";
import { Mochi } from "./Mochi";
import { ALL_CATEGORIES, isCreatorType } from "@/lib/creatorTaxonomy";

/** Explore grid card. Ranked by real support signals — never money raised. */
export function StreamerCard({ streamer }: { streamer: StreamerCardData }) {
  const t = useTranslations("explore");
  const tc = useTranslations("common");
  const tax = useTranslations("creatorTaxonomy");
  const category = ALL_CATEGORIES.includes(streamer.category)
    ? tax(`categories.${streamer.category}`)
    : streamer.category;
  const typeLabel =
    streamer.creatorType && isCreatorType(streamer.creatorType)
      ? tax(`types.${streamer.creatorType}`)
      : null;
  const facet = typeLabel ? `${typeLabel} · ${category}` : category;

  return (
    <Link
      href={`/s/${streamer.handle}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line-2 bg-card shadow-soft transition-shadow hover:shadow-card"
    >
      <CreatorCover
        handle={streamer.handle}
        displayName={streamer.displayName}
        className="h-[150px] w-full"
      />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-[9px]">
          <Avatar name={streamer.displayName} size={34} src={streamer.avatarUrl} />
          <div className="min-w-0">
            <div className="truncate text-base font-extrabold">
              {streamer.displayName}
            </div>
            <div className="text-2xs text-muted">
              {facet} · {streamer.avgViewers}명
            </div>
          </div>
        </div>

        <p className="mt-[10px] mb-4 text-xs text-muted">
          {t("cardSupporters", { count: streamer.backerCount })}
        </p>

        <div className="mt-auto flex items-center justify-center gap-[7px] rounded-md bg-coral-chip py-[11px] text-base font-bold text-coral-deep transition-colors group-hover:bg-coral group-hover:text-white">
          <Mochi width={17} height={14} /> {tc("backThisStreamer")}
        </div>
      </div>
    </Link>
  );
}

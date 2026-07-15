import Link from "next/link";
import { useTranslations } from "next-intl";
import type { StreamerCard as StreamerCardData } from "@/lib/streamers";
import { GradeBadge } from "./GradeBadge";
import { Avatar, Thumbnail } from "./ui/Placeholder";
import { Mochi } from "./Mochi";
import { formatPercent } from "@/lib/format";
import { ALL_CATEGORIES, isCreatorType } from "@/lib/creatorTaxonomy";

/** Explore grid card. Surfaces trust signals — never money raised. */
export function StreamerCard({ streamer }: { streamer: StreamerCardData }) {
  const t = useTranslations("explore");
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
      className="group flex flex-col overflow-hidden rounded-[20px] border border-line-2 bg-card shadow-soft transition-shadow hover:shadow-card"
    >
      <div className="relative">
        <Thumbnail label="썸네일" className="h-[150px] w-full" />
        <span className="absolute right-3 top-3">
          <GradeBadge grade={streamer.readiness} size="sm" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-[9px]">
          <Avatar name={streamer.displayName} size={34} src={streamer.avatarUrl} />
          <div className="min-w-0">
            <div className="truncate text-[15.5px] font-extrabold">
              @{streamer.displayName}
            </div>
            <div className="text-[12px] text-muted">
              {facet} · {streamer.avgViewers}명
            </div>
          </div>
        </div>

        {/* trust signals */}
        <div className="mt-3 grid grid-cols-3 gap-2 rounded-[12px] bg-panel p-[10px] text-center">
          <Stat value={`${streamer.backerCount}`} label={t("cardBackers")} />
          <Stat
            value={formatPercent(streamer.fulfillmentRate)}
            label={t("cardFulfillment")}
          />
          <Stat
            value={formatPercent(streamer.recurringRate)}
            label={t("cardRecurring")}
          />
        </div>

        <div className="mt-3 flex items-center justify-center gap-[7px] rounded-[12px] bg-coral-chip py-[11px] text-[14.5px] font-bold text-coral-deep transition-colors group-hover:bg-coral group-hover:text-white">
          <Mochi width={17} height={14} /> 응원하기
        </div>
      </div>
    </Link>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-[16px] font-extrabold tracking-[-0.02em]">{value}</div>
      <div className="text-[11px] leading-tight text-muted">{label}</div>
    </div>
  );
}

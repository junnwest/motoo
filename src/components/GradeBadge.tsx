import { useTranslations } from "next-intl";
import type { Grade } from "@/lib/grades";

/**
 * Sponsor-readiness / area grade pill. Grades are words only — Emerging / Strong
 * / Excellent — never a number or score (spec §6). The English word is shown as
 * the badge label (it reads as a rating), with the localized word available too.
 */
export function GradeBadge({
  grade,
  size = "md",
  showDot = true,
}: {
  grade: Grade;
  size?: "sm" | "md";
  showDot?: boolean;
}) {
  const t = useTranslations("common.grade");
  const dims =
    size === "sm"
      ? "px-[13px] py-[6px] text-[13px]"
      : "px-[15px] py-[7px] text-[15px]";

  return (
    <span
      className={`inline-flex items-center gap-[7px] rounded-full font-extrabold bg-sage-bg text-sage-text border border-sage-border ${dims}`}
      title={t(grade)}
    >
      {showDot && (
        <span
          className="inline-block w-2 h-2 rounded-full bg-sage"
          aria-hidden="true"
        />
      )}
      {grade.toUpperCase()}
    </span>
  );
}

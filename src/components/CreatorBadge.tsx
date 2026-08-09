import { IconCheckCircle } from "@/components/ui/Icons";

/**
 * "크리에이터 등록 완료" — marks an account that owns a Studio.
 *
 * Accounts are additive (a creator is a user who *also* owns a Studio), so
 * there's no account type to read off a page; this badge is what makes that
 * status legible in the two places a user looks for who they are: the nav's
 * avatar dropdown and their own `/profile`.
 *
 * Takes `label` rather than calling `useTranslations` itself, so the same
 * component works in the server-rendered profile header and inside `UserMenu`,
 * which is a client component with no next-intl of its own (the nav passes it
 * every string).
 *
 * Sage, not coral: this is a settled state, not a call to action — the Studio
 * pill next to it is the thing to click.
 */
export function CreatorBadge({
  label,
  size = "md",
  className = "",
}: {
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const sm = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-sage-bg font-semibold text-sage-text ${
        sm ? "px-2 py-0.5 text-2xs" : "px-2.5 py-1 text-xs"
      } ${className}`}
    >
      <IconCheckCircle
        width={sm ? 12 : 14}
        height={sm ? 12 : 14}
        className="flex-none"
      />
      {label}
    </span>
  );
}

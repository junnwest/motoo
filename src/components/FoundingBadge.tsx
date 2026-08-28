import { IconAward } from "@/components/ui/Icons";

/**
 * "파운딩 크리에이터" — marks a creator who joined before public launch, by
 * redeeming a direct invite (see `src/lib/invites.ts`).
 *
 * Coral, unlike `CreatorBadge`'s sage: that badge marks a settled account state,
 * this one is a distinction we are actively advertising to invited creators, and
 * it is one of the four things we promised them. Reputational only — it confers
 * nothing economic, which is deliberate (see DECISIONS 2026-08-28).
 *
 * Takes `label`/`title` rather than calling `useTranslations`, matching
 * `CreatorBadge` so it works in both server components and the client nav.
 */
export function FoundingBadge({
  label,
  title,
  className = "",
}: {
  label: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 border border-coral/40 bg-coral-chip px-2.5 py-1 text-2xs font-semibold tracking-[0.02em] text-coral-deep ${className}`}
    >
      <IconAward className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

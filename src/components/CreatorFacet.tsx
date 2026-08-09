/**
 * Renders a creator's taxonomy — primary TYPE (streamer/youtuber/author) and its
 * CATEGORY sub-facet — from already-translated labels. Presentational only (no
 * hooks), so it works in server and client trees; the caller resolves the labels
 * via next-intl's `creatorTaxonomy.*`.
 *
 * `chips` (default): a filled type pill + an outlined category pill (fan-facing,
 * e.g. the profile header). `text`: a muted "type · category" line (compact, e.g.
 * the Studio dashboard header).
 */
export function CreatorFacet({
  typeLabel,
  categoryLabel,
  variant = "chips",
  className = "",
}: {
  typeLabel?: string | null;
  categoryLabel?: string | null;
  variant?: "chips" | "text";
  className?: string;
}) {
  const type = typeLabel || null;
  const category = categoryLabel || null;
  if (!type && !category) return null;

  if (variant === "text") {
    return (
      <p className={`text-sm font-semibold text-muted-2 ${className}`}>
        {[type, category].filter(Boolean).join(" · ")}
      </p>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {type ? (
        <span className="rounded-full bg-coral-chip px-3 py-1 text-xs font-semibold text-coral-deep">
          {type}
        </span>
      ) : null}
      {category ? (
        <span className="rounded-full border border-line-3 bg-white px-3 py-1 text-xs font-medium text-muted-2">
          {category}
        </span>
      ) : null}
    </div>
  );
}

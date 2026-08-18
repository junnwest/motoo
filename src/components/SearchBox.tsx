"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconSearch } from "@/components/ui/Icons";

/**
 * The one search input (docs/PRELAUNCH.md #27), used both in the nav and at the
 * top of /search.
 *
 * A real <form> with a GET-shaped submit rather than an onChange that pushes on
 * every keystroke: search is three `contains` scans, and typing "김" on the way
 * to a longer name should not run them. It also means Enter works, the query
 * lands in the URL, and the result is shareable and back-button-able.
 */
export function SearchBox({
  defaultValue = "",
  autoFocus = false,
  compact = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  /** Nav sizing: shorter, and no visible label. */
  compact?: boolean;
}) {
  const t = useTranslations("search");
  const router = useRouter();

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("q");
        const q = typeof value === "string" ? value.trim() : "";
        // An empty submit goes to the bare page rather than ?q= — a query
        // parameter with nothing in it is noise in a shared link.
        router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
      }}
      className="relative w-full"
    >
      <IconSearch
        width={16}
        height={16}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        name="q"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        aria-label={t("inputLabel")}
        placeholder={t("placeholder")}
        className={`w-full rounded-full border border-line-2 bg-card pl-9 pr-4 text-ink outline-none transition-colors placeholder:text-muted focus:border-coral ${
          compact ? "h-9 text-sm" : "h-11 text-base"
        }`}
      />
    </form>
  );
}

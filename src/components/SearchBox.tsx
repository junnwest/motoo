"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { IconSearch } from "@/components/ui/Icons";
import { Avatar } from "@/components/ui/Placeholder";
import { Mochi } from "@/components/Mochi";
import { MIN_QUERY_LENGTH } from "@/lib/searchConfig";
import type { SearchResults } from "@/lib/search";

type Suggestions = Pick<SearchResults, "creators" | "items">;

/**
 * The one search input (docs/PRELAUNCH.md #27), used both in the nav and at the
 * top of /search.
 *
 * A real <form> with a GET-shaped submit rather than an onChange that pushes on
 * every keystroke: search is three `contains` scans, and typing "김" on the way
 * to a longer name should not run them. It also means Enter works, the query
 * lands in the URL, and the result is shareable and back-button-able.
 *
 * The nav instance (`compact`) additionally opens a live dropdown against
 * `/api/search/suggest` — a small combobox, not a second results page: it
 * shows just enough to jump straight to a creator or item, with "전체 결과
 * 보기" as the last row for everything else. /search's own instance stays
 * submit-only; a dropdown floating over the full results list it's already
 * showing would just be a second, competing answer to the same query.
 */
export function SearchBox({
  defaultValue = "",
  autoFocus = false,
  compact = false,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  /** Nav sizing: shorter, no visible label — and the live dropdown. */
  compact?: boolean;
}) {
  const t = useTranslations("search");
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Suggestions | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const rows = results ? [...results.creators, ...results.items] : [];
  // "View all" is always the last stop, whether or not there are rows above it —
  // Enter with nothing highlighted should still go somewhere.
  const rowCount = rows.length + 1;

  useEffect(() => {
    // Nothing to clear on the way back below MIN_QUERY_LENGTH: `results` is
    // only ever read while `trimmed.length >= MIN_QUERY_LENGTH` (see the
    // dropdown's render guard below), so stale state here is inert rather
    // than something that needs resetting synchronously.
    if (!compact || trimmed.length < MIN_QUERY_LENGTH) return;

    const handle = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => res.json())
        .then((data: Suggestions) => {
          setResults(data);
          setActiveIndex(-1);
        })
        .catch((err) => {
          if (err?.name !== "AbortError") setResults(null);
        });
      // Debounced rather than fired on every keystroke: search is a scan over
      // three tables, and a Korean syllable composing mid-character (e.g. "ㅁ"
      // → "모" → "모찌") would otherwise fire it two or three times per letter.
    }, 200);

    return () => clearTimeout(handle);
  }, [trimmed, compact]);

  useEffect(() => {
    if (!compact) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [compact]);

  function goTo(href: string) {
    setOpen(false);
    inputRef.current?.blur();
    router.push(href);
  }

  function submitSearch() {
    goTo(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (compact && activeIndex >= 0 && activeIndex < rows.length) {
            goTo(`/s/${rows[activeIndex].handle}`);
            return;
          }
          submitSearch();
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
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (compact) setOpen(true);
          }}
          onFocus={() => compact && setOpen(true)}
          onKeyDown={(e) => {
            if (!compact || !open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) => (i + 1 >= rowCount ? 0 : i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => (i <= 0 ? rowCount - 1 : i - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          autoFocus={autoFocus}
          autoComplete="off"
          role={compact ? "combobox" : undefined}
          aria-expanded={compact ? open : undefined}
          aria-controls={compact ? "search-suggest-listbox" : undefined}
          aria-activedescendant={
            compact && activeIndex >= 0 ? `search-suggest-${activeIndex}` : undefined
          }
          aria-autocomplete={compact ? "list" : undefined}
          aria-label={t("inputLabel")}
          placeholder={t("placeholder")}
          className={`w-full rounded-full border border-line-2 bg-card pl-9 pr-4 text-ink outline-none transition-colors placeholder:text-muted focus:border-coral ${
            compact ? "h-9 text-sm" : "h-11 text-base"
          }`}
        />
      </form>

      {compact && open && trimmed.length >= MIN_QUERY_LENGTH && (
        <div
          id="search-suggest-listbox"
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-y-auto rounded-xl border border-line-2 bg-card py-2 shadow-float"
        >
          {results === null ? (
            <div className="px-4 py-3 text-sm text-muted">…</div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted break-keep">
              {t("noSuggestions", { q: trimmed })}
            </div>
          ) : (
            rows.map((row, i) => {
              return (
                <Link
                  key={row.id}
                  href={`/s/${row.handle}`}
                  id={`search-suggest-${i}`}
                  role="option"
                  aria-selected={activeIndex === i}
                  onClick={() => setOpen(false)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    activeIndex === i ? "bg-cream-warm" : "hover:bg-cream-warm"
                  }`}
                >
                  {"displayName" in row ? (
                    <>
                      <Avatar name={row.displayName} src={row.avatarUrl} size={28} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">
                          {row.displayName}
                        </span>
                        <span className="block truncate text-2xs text-muted">
                          @{row.handle}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-cream text-muted">
                        <IconSearch width={13} height={13} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-ink">
                          {row.title}
                        </span>
                        <span className="block truncate text-2xs text-muted">
                          {row.creatorName}
                        </span>
                      </span>
                      <span className="flex flex-none items-center gap-1 text-xs font-extrabold text-ink">
                        <Mochi width={11} height={9} className="text-coral-deep" />
                        {t("price", { count: row.priceMochi })}
                      </span>
                    </>
                  )}
                </Link>
              );
            })
          )}

          <Link
            href={`/search?q=${encodeURIComponent(trimmed)}`}
            id={`search-suggest-${rows.length}`}
            role="option"
            aria-selected={activeIndex === rows.length}
            onClick={() => setOpen(false)}
            className={`mt-1 flex w-full items-center gap-2 border-t border-line-2 px-4 py-2.5 text-left text-sm font-bold text-coral-deep transition-colors ${
              activeIndex === rows.length ? "bg-cream-warm" : "hover:bg-cream-warm"
            }`}
          >
            <IconSearch width={14} height={14} aria-hidden />
            {t("viewAll", { q: trimmed })}
          </Link>
        </div>
      )}
    </div>
  );
}

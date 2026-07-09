"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";

/** URL-driven filter/sort bar for Explore. Ranking never includes money raised. */
export function ExploreFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("explore");
  const tCat = useTranslations("fanLanding.categories");

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`/explore?${next.toString()}`);
    },
    [params, router],
  );

  const selectClass =
    "rounded-[12px] border border-line-3 bg-white px-3 py-[10px] text-[14px] font-medium text-ink outline-none focus:border-coral";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        action="/explore"
        className="flex flex-1 items-center gap-[10px] rounded-[12px] border border-line-3 bg-white px-4 py-[10px]"
      >
        <span aria-hidden="true">🔍</span>
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted"
        />
      </form>

      <select
        aria-label={t("filterCategory")}
        className={selectClass}
        value={params.get("category") ?? "all"}
        onChange={(e) => setParam("category", e.target.value)}
      >
        {["all", "game", "daily", "music", "virtual", "study"].map((c) => (
          <option key={c} value={c}>
            {c === "all" ? t("filterCategory") : tCat(c as never)}
          </option>
        ))}
      </select>

      <select
        aria-label={t("filterBackers")}
        className={selectClass}
        value={params.get("backerRange") ?? "all"}
        onChange={(e) => setParam("backerRange", e.target.value)}
      >
        {["all", "under50", "50to200", "over200"].map((r) => (
          <option key={r} value={r}>
            {r === "all"
              ? t("filterBackers")
              : t(`backerCountRanges.${r}` as never)}
          </option>
        ))}
      </select>

      <select
        aria-label={t("sortLabel")}
        className={selectClass}
        value={params.get("sort") ?? "readiness"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        {["readiness", "backers", "recurring", "newest"].map((s) => (
          <option key={s} value={s}>
            {t(`sort.${s}` as never)}
          </option>
        ))}
      </select>
    </div>
  );
}

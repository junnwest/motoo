"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { IconSearch } from "@/components/ui/Icons";
import { Select } from "@/components/ui/Field";
import {
  CREATOR_TYPES,
  CATEGORIES_BY_TYPE,
  ALL_CATEGORIES,
  isCreatorType,
} from "@/lib/creatorTaxonomy";

/** URL-driven filter/sort bar for Explore. Ranking never includes money raised. */
export function ExploreFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const t = useTranslations("explore");
  const tax = useTranslations("creatorTaxonomy");

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`/explore?${next.toString()}`);
    },
    [params, router],
  );

  // Type is primary; category is its dependent sub-facet. Changing the type
  // clears any category that no longer belongs to it.
  const setType = useCallback(
    (value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete("type");
      else next.set("type", value);
      next.delete("category");
      router.push(`/explore?${next.toString()}`);
    },
    [params, router],
  );

  const activeType = params.get("type") ?? "all";
  const categoryOptions =
    activeType !== "all" && isCreatorType(activeType)
      ? CATEGORIES_BY_TYPE[activeType]
      : ALL_CATEGORIES;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form
        action="/explore"
        className="flex flex-1 items-center gap-[10px] rounded-[12px] border border-line-3 bg-white px-4 py-[10px]"
      >
        <IconSearch width={17} height={17} className="flex-none text-muted" />
        <input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full bg-transparent text-[14px] outline-none placeholder:text-muted"
        />
      </form>

      <Select
        aria-label={t("filterType")}
        size="sm"
        value={activeType}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="all">{t("filterType")}</option>
        {CREATOR_TYPES.map((ty) => (
          <option key={ty} value={ty}>
            {tax(`types.${ty}`)}
          </option>
        ))}
      </Select>

      <Select
        aria-label={t("filterCategory")}
        size="sm"
        value={params.get("category") ?? "all"}
        onChange={(e) => setParam("category", e.target.value)}
      >
        <option value="all">{t("filterCategory")}</option>
        {categoryOptions.map((c) => (
          <option key={c} value={c}>
            {tax(`categories.${c}`)}
          </option>
        ))}
      </Select>

      <Select
        aria-label={t("filterBackers")}
        size="sm"
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
      </Select>

      <Select
        aria-label={t("sortLabel")}
        size="sm"
        value={params.get("sort") ?? "backers"}
        onChange={(e) => setParam("sort", e.target.value)}
      >
        {["backers", "newest"].map((s) => (
          <option key={s} value={s}>
            {t(`sort.${s}` as never)}
          </option>
        ))}
      </Select>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import {
  CREATOR_TYPES,
  CATEGORIES_BY_TYPE,
  isCreatorType,
  type CreatorType,
} from "@/lib/creatorTaxonomy";
import { updateStreamerProfile } from "../actions";

export type ProfileValues = {
  handle: string;
  displayName: string;
  bio: string;
  creatorType: string;
  category: string;
  chzzk: string;
  soop: string;
  youtube: string;
  twitch: string;
  discordUrl: string;
  fanCafeUrl: string;
};

// key = the field on the action/Streamer; label = messages settings.links.<label>.
const LINK_FIELDS = [
  { key: "chzzk", label: "chzzk" },
  { key: "soop", label: "soop" },
  { key: "youtube", label: "youtube" },
  { key: "twitch", label: "twitch" },
  { key: "discordUrl", label: "discord" },
  { key: "fanCafeUrl", label: "fanCafe" },
] as const;

export function SettingsForm({ initial }: { initial: ProfileValues }) {
  const t = useTranslations("creatorDashboard"); // settings.* + saveError
  const to = useTranslations("creatorOnboarding"); // shared field labels
  const tax = useTranslations("creatorTaxonomy");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [bio, setBio] = useState(initial.bio);
  const [creatorType, setCreatorType] = useState<CreatorType | "">(
    isCreatorType(initial.creatorType) ? initial.creatorType : "",
  );
  const [category, setCategory] = useState(initial.category);
  const [links, setLinks] = useState<Record<string, string>>({
    chzzk: initial.chzzk,
    soop: initial.soop,
    youtube: initial.youtube,
    twitch: initial.twitch,
    discordUrl: initial.discordUrl,
    fanCafeUrl: initial.fanCafeUrl,
  });

  const categoryOptions = creatorType ? CATEGORIES_BY_TYPE[creatorType] : [];
  const canSubmit =
    !!displayName.trim() && !!creatorType && !!category && !pending;

  function onTypeChange(next: string) {
    setCreatorType(next as CreatorType);
    setCategory(""); // dependent category resets when the type changes
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(false);
    startTransition(async () => {
      const res = await updateStreamerProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        creatorType,
        category,
        chzzk: links.chzzk.trim(),
        soop: links.soop.trim(),
        youtube: links.youtube.trim(),
        twitch: links.twitch.trim(),
        discordUrl: links.discordUrl.trim(),
        fanCafeUrl: links.fanCafeUrl.trim(),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(true);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Profile */}
      <section className="rounded-[20px] border border-line-2 bg-card p-6 sm:p-7">
        <h2 className="mb-4 text-[16px] font-bold text-ink">
          {to("sectionProfile")}
        </h2>
        <div className="flex flex-col gap-4">
          <Input
            label={to("displayName")}
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={to("displayNamePlaceholder")}
          />

          <Input
            label={to("handle")}
            hint={t("settings.handleReadonly")}
            type="text"
            value={`@${initial.handle}`}
            readOnly
            disabled
            className="cursor-not-allowed bg-panel text-muted"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label={to("creatorType")}
              value={creatorType}
              onChange={(e) => onTypeChange(e.target.value)}
              required
            >
              <option value="" disabled>
                {to("typePlaceholder")}
              </option>
              {CREATOR_TYPES.map((ty) => (
                <option key={ty} value={ty}>
                  {tax(`types.${ty}`)}
                </option>
              ))}
            </Select>

            <Select
              label={to("category")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              disabled={!creatorType}
              className="disabled:bg-panel disabled:text-muted"
            >
              <option value="" disabled>
                {creatorType
                  ? to("categoryPlaceholder")
                  : to("categoryTypeFirst")}
              </option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {tax(`categories.${c}`)}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label={to("bio")}
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={to("bioPlaceholder")}
          />
        </div>
      </section>

      {/* Platform links */}
      <section className="rounded-[20px] border border-line-2 bg-card p-6 sm:p-7">
        <h2 className="mb-4 text-[16px] font-bold text-ink">
          {t("settings.sectionLinks")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LINK_FIELDS.map((f) => (
            <Input
              key={f.key}
              label={t(`settings.links.${f.label}` as never)}
              type="url"
              inputMode="url"
              value={links[f.key]}
              onChange={(e) =>
                setLinks((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              placeholder={t("settings.linkPlaceholder")}
            />
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg" disabled={!canSubmit}>
          {pending ? t("settings.saving") : t("settings.save")}
        </Button>
        {saved ? (
          <span className="rounded-full bg-sage-bg px-3 py-1.5 text-[13px] font-semibold text-sage">
            {t("settings.saved")}
          </span>
        ) : null}
        {error ? (
          <span className="text-[13px] font-semibold text-live">
            {t("saveError")}
          </span>
        ) : null}
      </div>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { AVATAR_SPEC } from "@/lib/imageUpload";
import { updateAvatar } from "./actions";

/**
 * Profile picture. Picking an image only stages it — nothing is written until
 * 저장, matching the other two settings groups (identity, password) rather than
 * saving on pick, so "choose the wrong file" is recoverable with 취소.
 *
 * `router.refresh()` after a save is what re-renders the nav avatar, which is
 * server-rendered from the DB (the picture can't ride in the JWT — see
 * `Backer.avatarUrl` in schema.prisma).
 */
export function AvatarForm({ initialAvatar }: { initialAvatar: string | null }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [saved, setSaved] = useState<string | null>(initialAvatar);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(
    null,
  );

  const dirty = avatar !== saved;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    startTransition(async () => {
      const res = await updateAvatar(avatar);
      if (res.ok) {
        setSaved(avatar);
        setResult({ ok: true });
        router.refresh();
      } else {
        setResult({ ok: false, error: res.error });
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <ImagePicker
        value={avatar}
        onChange={(v) => {
          setResult(null);
          setAvatar(v);
        }}
        spec={AVATAR_SPEC}
        shape="circle"
        label={t("avatarLabel")}
        disabled={pending}
      />

      <div className="flex items-center gap-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!dirty || pending}
        >
          {pending ? t("saving") : t("save")}
        </Button>
        {dirty && !pending ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={() => {
              setAvatar(saved);
              setResult(null);
            }}
          >
            {t("cancel")}
          </Button>
        ) : null}
      </div>

      {result?.ok && (
        <p className="text-sm font-semibold text-sage">{t("saved")}</p>
      )}
      {result?.ok === false && (
        <p className="text-sm font-semibold text-live">
          {t(`errors.${result.error}` as never)}
        </p>
      )}
    </form>
  );
}

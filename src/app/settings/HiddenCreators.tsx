"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Placeholder";
import { toggleHideCreator } from "@/lib/block-actions";

/**
 * The list of creators this fan has hidden, and the way back.
 *
 * Necessary because hiding works: a hidden creator is gone from explore, the
 * rail and notifications, so their own page — where the undo lives — is the one
 * place the fan can no longer stumble across. Without this, hiding would be
 * effectively permanent for anyone who forgot the handle.
 */
export function HiddenCreators({
  creators,
}: {
  creators: { id: string; handle: string; displayName: string; avatarUrl: string | null }[];
}) {
  const t = useTranslations("hideCreator");
  const router = useRouter();
  const [pending, start] = useTransition();

  if (creators.length === 0) {
    return <p className="text-sm text-muted">{t("empty")}</p>;
  }

  return (
    <div>
      <p className="mb-3 break-keep text-sm text-muted">{t("sectionHelp")}</p>
      <ul className="flex flex-col">
        {creators.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 border-b border-line-2 py-3 last:border-b-0"
          >
            <Avatar name={c.displayName} src={c.avatarUrl} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-ink">
                {c.displayName}
              </div>
              <div className="truncate text-xs text-muted">@{c.handle}</div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="!px-2.5 !py-1 !text-2xs"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const res = await toggleHideCreator(c.id);
                  if (res.ok) router.refresh();
                })
              }
            >
              {t("undo")}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

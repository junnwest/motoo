"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { InlineMessage } from "@/components/ui/InlineMessage";
import { setNotificationPrefAction } from "./notification-actions";
import type { NotificationType } from "@prisma/client";

/**
 * One checkbox per mutable notification type, saving on change — the same
 * pattern as marketing consent, and for the same reason: a save button someone
 * can forget to press is friction on turning something off.
 *
 * Optimistic, reverting if the write fails, so a checkbox never claims a state
 * the database disagrees with.
 */
export function NotificationPrefsForm({
  initial,
}: {
  initial: Record<string, boolean>;
}) {
  const t = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div>
      <div className="flex flex-col gap-3">
        {Object.keys(initial).map((type) => (
          <label key={type} className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={prefs[type]}
              disabled={pending}
              className="mt-1 accent-coral"
              onChange={(e) => {
                const next = e.target.checked;
                setPrefs((p) => ({ ...p, [type]: next })); // optimistic
                setError(null);
                start(async () => {
                  const res = await setNotificationPrefAction(
                    type as NotificationType,
                    next,
                  );
                  if (!res.ok) {
                    setPrefs((p) => ({ ...p, [type]: !next })); // revert
                    setError(res.error);
                  }
                });
              }}
            />
            <span className="break-keep text-sm leading-relaxed text-body">
              {t(`types.${type}` as never)}
            </span>
          </label>
        ))}
      </div>

      {/* The order notices are not shown as disabled checkboxes — a greyed
          control invites clicking and then explains nothing. A sentence says
          what always arrives and why. */}
      <p className="mt-4 break-keep border-l-2 border-line-2 pl-4 text-xs leading-relaxed text-muted">
        {t("alwaysOn")}
      </p>

      {error && (
        <InlineMessage tone="error" className="mt-3">
          {t(`errors.${error}` as never)}
        </InlineMessage>
      )}
    </div>
  );
}

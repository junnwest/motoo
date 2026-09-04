"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { InlineMessage } from "@/components/ui/InlineMessage";
import type { EnabledProviders, OAuthProvider } from "@/lib/auth-providers";
import { formatKstDate } from "@/lib/format";
import { unlinkAccountAction } from "./linked-accounts-actions";

const KakaoMark = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path
      d="M9 2C5.13 2 2 4.46 2 7.5c0 1.94 1.3 3.64 3.26 4.6-.14.5-.52 1.86-.6 2.15-.09.35.13.35.27.26.1-.07 1.62-1.1 2.28-1.55.25.03.52.05.79.05 3.87 0 7-2.46 7-5.5S12.87 2 9 2z"
      fill="#191600"
    />
  </svg>
);

/** Brand-colored provider chip, matching SocialButtons' colors (login/signup). */
function ProviderMark({ provider }: { provider: OAuthProvider }) {
  if (provider === "kakao") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FEE500]">
        <KakaoMark />
      </span>
    );
  }
  if (provider === "naver") {
    return (
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#03C75A] text-sm font-black text-white">
        N
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-line-3 bg-white text-sm font-black text-[#4285F4]">
      G
    </span>
  );
}

type LinkedRow = { id: string; provider: OAuthProvider; linkedAt: string };
type Flash = { tone: "success" | "error"; text: string };

/**
 * Connected social accounts — link/unlink Google/Kakao/Naver. Linking is a
 * plain `<a>` to /api/settings/link/<provider> (a real navigation, ending in
 * an external redirect — see that route), not a server action; unlinking is
 * `unlinkAccountAction`, confirmed via the same Modal pattern AccountSection
 * uses for account deletion.
 */
export function ConnectedAccountsSection({
  providers,
  linkedAccounts,
  hasPassword,
  initialFlash,
}: {
  providers: EnabledProviders;
  linkedAccounts: LinkedRow[];
  hasPassword: boolean;
  initialFlash: { linked?: string; linkError?: string };
}) {
  const t = useTranslations("settings");
  const tc = useTranslations("common");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<LinkedRow | null>(null);
  // Lazy init, not an effect: this derives from the query params the page
  // already rendered with, not from an external system — setting it in an
  // effect would just be a same-render setState round trip for nothing.
  const [msg, setMsg] = useState<Flash | null>(() => {
    if (initialFlash.linked) {
      return {
        tone: "success",
        text: t("connectedAccounts.linkedFlash", {
          provider: t(`connectedAccounts.providerNames.${initialFlash.linked}` as never),
        }),
      };
    }
    if (initialFlash.linkError) {
      return {
        tone: "error",
        text: t(`connectedAccounts.errors.${initialFlash.linkError}` as never),
      };
    }
    return null;
  });

  useEffect(() => {
    // The actual external-system sync: drop ?linked=/?linkError= from the URL
    // so a refresh doesn't re-show a stale flash. No setState here on purpose.
    if (initialFlash.linked || initialFlash.linkError) {
      router.replace("/settings", { scroll: false });
    }
    // Run once, from the params the page mounted with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function unlink() {
    if (!confirming) return;
    setMsg(null);
    startTransition(async () => {
      const res = await unlinkAccountAction(confirming.id);
      setConfirming(null);
      if (res.ok) {
        router.refresh();
      } else {
        setMsg({ tone: "error", text: t(`connectedAccounts.errors.${res.error}` as never) });
      }
    });
  }

  const byProvider = Object.fromEntries(
    linkedAccounts.map((r) => [r.provider, r]),
  ) as Partial<Record<OAuthProvider, LinkedRow>>;
  const linkedCount = linkedAccounts.length;

  return (
    <div>
      {msg && (
        <InlineMessage tone={msg.tone} className="mb-4">
          {msg.text}
        </InlineMessage>
      )}

      <div className="flex flex-col divide-y divide-line-2">
        {(["kakao", "naver", "google"] as const).map((provider) => {
          const row = byProvider[provider];
          const isLastMethod = !hasPassword && linkedCount === 1 && !!row;
          return (
            <div
              key={provider}
              className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3">
                <ProviderMark provider={provider} />
                <div>
                  <div className="text-sm font-bold text-ink">
                    {t(`connectedAccounts.providerNames.${provider}` as never)}
                  </div>
                  {row ? (
                    <div className="text-2xs text-muted">
                      {t("connectedAccounts.linkedAt", {
                        date: formatKstDate(new Date(row.linkedAt)),
                      })}
                    </div>
                  ) : null}
                </div>
              </div>

              {row ? (
                // Linked always wins over the env-enabled check below: a
                // provider disabled after someone already linked it (env var
                // pulled, incident response, etc.) must still be unlinkable —
                // unlinkAccount's own logic has no dependency on whether the
                // provider is currently configured, so the UI shouldn't
                // strand that row behind a "coming soon" badge either.
                isLastMethod ? (
                  <span className="max-w-[180px] text-right text-2xs text-muted break-keep">
                    {t("connectedAccounts.lastMethod")}
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    disabled={pending}
                    onClick={() => setConfirming(row)}
                  >
                    {t("connectedAccounts.unlinkCta")}
                  </Button>
                )
              ) : !providers[provider] ? (
                <span className="rounded-full bg-panel px-2.5 py-1 text-2xs font-semibold text-muted">
                  {t("connectedAccounts.comingSoonBadge")}
                </span>
              ) : (
                <a
                  href={`/api/settings/link/${provider}`}
                  className="inline-flex items-center justify-center rounded-lg border-[1.5px] border-line-3 bg-white px-4 py-2 text-sm font-bold text-ink transition hover:border-line-4"
                >
                  {t("connectedAccounts.linkCta")}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <Modal
        open={!!confirming}
        onClose={() => setConfirming(null)}
        titleId="unlink-account"
        closeLabel={tc("close")}
      >
        <h2
          id="unlink-account"
          className="text-xl font-extrabold tracking-[-0.02em] text-ink break-keep"
        >
          {t("connectedAccounts.unlinkConfirmTitle")}
        </h2>
        <p className="mt-2 text-base leading-relaxed text-body break-keep">
          {confirming
            ? t("connectedAccounts.unlinkConfirmBody", {
                provider: t(`connectedAccounts.providerNames.${confirming.provider}` as never),
              })
            : ""}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            loading={pending}
            onClick={unlink}
          >
            {t("connectedAccounts.unlinkConfirmCta")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            disabled={pending}
            onClick={() => setConfirming(null)}
          >
            {t("connectedAccounts.cancel")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

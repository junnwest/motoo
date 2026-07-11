"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { EnabledProviders, OAuthProvider } from "@/lib/auth-providers";
import { oauthSignIn } from "@/app/auth-actions";

const KakaoMark = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path
      d="M9 2C5.13 2 2 4.46 2 7.5c0 1.94 1.3 3.64 3.26 4.6-.14.5-.52 1.86-.6 2.15-.09.35.13.35.27.26.1-.07 1.62-1.1 2.28-1.55.25.03.52.05.79.05 3.87 0 7-2.46 7-5.5S12.87 2 9 2z"
      fill="#191600"
    />
  </svg>
);

/**
 * Social sign-in buttons (Kakao / Naver / Google) + an "or" divider, shared by
 * the signup and login screens. A provider with no credentials shows a "준비 중"
 * badge and, on click, a graceful "coming soon" note instead of a dead redirect.
 */
export function SocialButtons({ providers }: { providers: EnabledProviders }) {
  const t = useTranslations("auth");
  const [pending, startTransition] = useTransition();
  const [oauthPending, setOauthPending] = useState<OAuthProvider | null>(null);
  const [note, setNote] = useState(false);
  const busy = pending || oauthPending !== null;

  function social(provider: OAuthProvider) {
    setNote(false);
    if (!providers[provider]) {
      setNote(true);
      return;
    }
    setOauthPending(provider);
    startTransition(async () => {
      const res = await oauthSignIn(provider);
      if (res && !res.ok) {
        setNote(true);
        setOauthPending(null);
      }
    });
  }

  return (
    <div>
      <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
        <span className="h-px flex-1 bg-line-3" />
        {t("orDivider")}
        <span className="h-px flex-1 bg-line-3" />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => social("kakao")}
          disabled={busy}
          className="relative flex w-full items-center justify-center rounded-[12px] bg-[#FEE500] px-4 py-3 text-[15px] font-bold text-[#191600] transition active:scale-[.99] disabled:opacity-60"
        >
          <span className="absolute left-4">
            <KakaoMark />
          </span>
          {t("kakaoContinue")}
          {!providers.kakao && (
            <span className="absolute right-3 rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold text-[#191600]">
              {t("comingSoonBadge")}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => social("naver")}
          disabled={busy}
          className="relative flex w-full items-center justify-center rounded-[12px] bg-[#03C75A] px-4 py-3 text-[15px] font-bold text-white transition active:scale-[.99] disabled:opacity-60"
        >
          <span className="absolute left-[18px] text-[16px] font-black">N</span>
          {t("naverContinue")}
          {!providers.naver && (
            <span className="absolute right-3 rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold text-white">
              {t("comingSoonBadge")}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => social("google")}
          disabled={busy}
          className="relative flex w-full items-center justify-center rounded-[12px] border-[1.5px] border-line-3 bg-white px-4 py-3 text-[15px] font-bold text-ink transition hover:border-line-4 active:scale-[.99] disabled:opacity-60"
        >
          <span className="absolute left-4 text-[16px] font-black text-[#4285F4]">
            G
          </span>
          {t("googleContinue")}
          {!providers.google && (
            <span className="absolute right-3 rounded-full bg-panel px-2 py-0.5 text-[11px] font-semibold text-muted">
              {t("comingSoonBadge")}
            </span>
          )}
        </button>
      </div>

      {note && (
        <p className="mt-2.5 text-[13px] leading-[1.5] text-muted">
          {t("socialComingSoon")}
        </p>
      )}
    </div>
  );
}

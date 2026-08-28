"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches failures in the **root layout itself**, which
 * `app/error.tsx` sits below and therefore cannot catch. This replaces the whole
 * document, so it has to supply its own `<html>`/`<body>`.
 *
 * Two deliberate departures from house rules, both forced by what this file is:
 *
 * 1. **Copy is hardcoded, not in `messages/`.** The root layout is what mounts
 *    `NextIntlClientProvider`; if we're here, that layout threw, so there is no
 *    translation context to read from and no way to `await getMessages()` from a
 *    client component. Korean is the only shipping locale (see the Stage 8
 *    decision to drop `en.json`), so hardcoding it costs nothing today.
 * 2. **Styles are inline, not Tailwind.** `globals.css` is imported by the root
 *    layout too. If the layout is what failed, the stylesheet may never have
 *    been applied — a Tailwind-classed fallback would render as unstyled HTML,
 *    which is the exact failure this page exists to prevent. Inline styles are
 *    the only ones guaranteed to survive. Colors are copied from the `@theme`
 *    tokens in globals.css (cream / ink / body / coral) and must be updated by
 *    hand if those change.
 *
 * This should be effectively unreachable. `app/error.tsx` is the one users will
 * actually see.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root layout error", error.digest ?? "", error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          color: "#211c18",
          fontFamily:
            "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        <main
          style={{
            maxWidth: 480,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            문제가 생겼어요
          </h1>
          <p
            style={{
              marginTop: 12,
              fontSize: 16,
              lineHeight: 1.6,
              color: "#74695f",
              wordBreak: "keep-all",
            }}
          >
            잠시 문제가 있었어요. 다시 시도해 보시고, 계속 이 화면이 보이면
            알려주세요.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 28,
              padding: "13px 26px",
              fontSize: 15,
              fontWeight: 700,
              color: "#ffffff",
              background: "#ff5722",
              border: "none",
              borderRadius: 14,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
          {error.digest && (
            <p
              style={{
                marginTop: 28,
                fontSize: 11,
                letterSpacing: "0.04em",
                color: "#9b8d7c",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              오류 코드 · {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}

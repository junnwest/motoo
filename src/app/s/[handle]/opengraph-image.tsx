import { ImageResponse } from "next/og";
import { getStreamerProfile } from "@/lib/streamers";
import { getSupporterLeaderboard } from "@/lib/ranking";
import { getTranslations } from "next-intl/server";

/**
 * The share card for a creator page — the image that shows up when a creator
 * posts their link to KakaoTalk, X, or Discord. Before this there was none at
 * all, so every share rendered as a bare text row.
 *
 * Drawn rather than photographed: motoo has no object storage (avatars are data
 * URLs capped at 60KB — see src/lib/imageUpload.ts), so there is no hosted image
 * to point at. `next/og` renders this server-side per handle instead, which also
 * means the numbers on the card are current at share time.
 *
 * Deliberately plain inline styles: Satori (what powers ImageResponse) supports
 * only a subset of CSS and no Tailwind.
 *
 * **Fonts are the load-bearing detail here.** Satori ships Latin coverage only,
 * so the first working version of this route returned HTTP 500 for every real
 * creator — the moment any Hangul appeared it had no glyphs to draw. Pretendard
 * (the app's typeface) is published as woff2, which Satori can't read either.
 * So the card fetches a Noto Sans KR subset containing *only the characters on
 * this specific card*: 58KB instead of the 6.1MB full face, a ~100x saving that
 * makes a per-render fetch reasonable.
 */

/**
 * Fetch a font subset covering exactly `text`.
 *
 * Google Fonts' `text=` parameter does the subsetting server-side. The UA
 * matters: with a modern one Google returns woff2, which Satori rejects — an
 * older UA gets TTF. The returned URL is extensionless (`/l/font?kit=…`), so it
 * has to be read out of the CSS rather than pattern-matched for a suffix.
 *
 * Returns null rather than throwing: a missing font should degrade the card,
 * never 500 the route the way the original font-less version did.
 */
async function loadFontSubset(text: string): Promise<ArrayBuffer | null> {
  try {
    const cssUrl =
      "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&text=" +
      encodeURIComponent(text);
    const css = await fetch(cssUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    }).then((r) => r.text());
    const src = css.match(/src:\s*url\(([^)]+)\)/);
    if (!src) return null;
    return await fetch(src[1]).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export const alt = "motoo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand tokens, copied from the @theme block in globals.css. Satori can't read
// CSS variables, so these are literals and must be updated with the tokens.
const CREAM = "#fde9e2";
const INK = "#211c18";
const BODY = "#74695f";
const CORAL = "#f15a29";
const CORAL_DEEP = "#d43e0e";
const LINE = "#ece1d2";

export default async function Image({
  params,
}: {
  // Promise, like every other dynamic API in Next 16 — including here, which is
  // easy to miss because an OG route looks nothing like a page. Typing it as a
  // plain object compiles fine and then silently passes `undefined` to Prisma.
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getStreamerProfile(handle);

  // Unknown/unapproved handle: fall back to a brand card rather than throwing.
  // A share of a dead link should still render something, and the page itself
  // is already returning a real 404.
  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: CREAM,
            color: INK,
            fontSize: 96,
            fontWeight: 700,
          }}
        >
          motoo
        </div>
      ),
      size,
    );
  }

  const { streamer } = data;
  const [t, { totalSupporters, totalMochiEarned }] = await Promise.all([
    getTranslations("profile"),
    getSupporterLeaderboard(streamer.id, 1),
  ]);
  const initial = streamer.displayName.trim().charAt(0);

  const supporters = totalSupporters.toLocaleString("ko-KR");
  const mochi = totalMochiEarned.toLocaleString("ko-KR");
  // Exactly the glyphs this card draws — the subset is built from this string,
  // so anything rendered below must be represented here or it comes out blank.
  const fontData = await loadFontSubset(
    streamer.displayName +
      streamer.handle +
      t("backers") +
      t("totalMochi") +
      supporters +
      mochi +
      "motoo@,.",
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: CREAM,
          padding: 72,
          fontFamily: "Noto Sans KR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Monogram, not the uploaded avatar: a 60KB data URL inlined into an
              OG image bloats it for no gain at this size. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              borderRadius: 999,
              background: "#f1e4d4",
              color: CORAL_DEEP,
              fontSize: 64,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 68, fontWeight: 700, color: INK }}>
              {streamer.displayName}
            </div>
            {/* One template string, not `@{handle}`: that is two child nodes,
                and Satori throws on any element with multiple children unless it
                declares display:flex. */}
            <div style={{ fontSize: 34, color: BODY, marginTop: 8 }}>
              {`@${streamer.handle}`}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 64 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: INK }}>
              {supporters}
            </div>
            <div style={{ fontSize: 28, color: BODY }}>{t("backers")}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 56, fontWeight: 700, color: INK }}>
              {mochi}
            </div>
            <div style={{ fontSize: 28, color: BODY }}>{t("totalMochi")}</div>
          </div>
          <div
            style={{
              display: "flex",
              marginLeft: "auto",
              alignItems: "center",
              gap: 16,
              borderTop: `2px solid ${LINE}`,
              paddingTop: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 32,
                // Satori has no support for the elliptical (slash) border-radius syntax the
                // real .mochi blob uses; a plain ellipse is the closest it can draw.
                borderRadius: "50%",
                background: CORAL,
              }}
            />
            <div style={{ fontSize: 40, fontWeight: 700, color: INK }}>
              motoo
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // No `weight` on the descriptor on purpose: Satori matches fonts by
      // (family, weight, style), and the stat labels below inherit fontWeight 400.
      // Registering this face as 700 only left every 400-weight Hangul run
      // unmatched, which silently fell back to the Latin-only default and failed
      // the whole render with "failed to pipe response".
      // Only declare the font when it actually loaded; passing an empty list
      // makes Satori fall back to its built-in Latin face rather than error.
      ...(fontData
        ? {
            fonts: [
              {
                name: "Noto Sans KR",
                data: fontData,
                style: "normal" as const,
              },
            ],
          }
        : {}),
    },
  );
}

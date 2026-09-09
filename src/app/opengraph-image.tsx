import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";

/**
 * The share card for everything that isn't a creator page — the welcome page,
 * the invite door, the legal pages.
 *
 * `/s/[handle]` had one; nothing else did, while the root metadata declared
 * `twitter:card=summary_large_image`. A large-image card with no image is not a
 * smaller card, it is a broken one: X drops back to a bare text row and
 * KakaoTalk renders an empty grey block. That mattered the moment outreach
 * started, because an invite link (`/join/<token>`) is pasted into a DM and its
 * preview is the first thing an approached creator sees of the product. Next
 * applies this file to the whole segment, so every page without its own card
 * inherits it and the creator page still overrides it.
 *
 * Everything here is a deliberate copy of the decisions worked out in
 * `s/[handle]/opengraph-image.tsx` — read that file's comments before changing
 * this one. The two that bite hardest: Satori has no Hangul glyphs (a font-less
 * version 500s the moment Korean appears), and any element with more than one
 * child must declare `display: flex`.
 */

/**
 * Fetch a Noto Sans KR subset covering exactly `text` — see the creator card
 * for why the User-Agent and the CSS-scrape matter. Returns null rather than
 * throwing so a font outage degrades the card instead of 500ing the route.
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

// Brand tokens, copied from the @theme block in globals.css — Satori cannot
// read CSS variables. The warm tint rather than the page's white for the same
// reason the creator card uses it: a white card dissolves into the white chrome
// of a Twitter or KakaoTalk preview.
const WARM = "#fee9e1";
const INK = "#211c18";
const BODY = "#74695f";
const CORAL = "#ff5722";
const LINE = "#ece1d2";

export default async function Image() {
  const t = await getTranslations("meta");
  const tagline = t("ogTagline");
  const fee = t("ogFee");

  // The subset is built from exactly what this card draws; a glyph missing from
  // this string comes out blank.
  const fontData = await loadFontSubset(tagline + fee + "motoo%0");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: WARM,
          padding: 84,
          fontFamily: "Noto Sans KR",
        }}
      >
        {/* The wordmark is Bauhaus 93 outlines in the app (never webfonted —
            see BrandWordmark.tsx), and Satori draws text, not paths. So the
            name is set in the card's own face and carried by the mochi mark
            beside it rather than by the letterforms. */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 52,
              height: 42,
              // Satori has no elliptical (slash) border-radius, so the real
              // mochi blob is approximated by an ellipse — same compromise the
              // creator card makes.
              borderRadius: "50%",
              background: CORAL,
            }}
          />
          <div style={{ fontSize: 52, fontWeight: 700, color: INK }}>motoo</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 54,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.38,
              // Wraps on its own rather than carrying a newline in the message:
              // Satori's whitespace handling is a subset, and a copy edit
              // should not be able to break the layout by moving a break.
              maxWidth: 980,
            }}
          >
            {tagline}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 36,
              paddingTop: 28,
              borderTop: `2px solid ${LINE}`,
              fontSize: 32,
              color: BODY,
            }}
          >
            {fee}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      // No `weight` in the descriptor — see the creator card: registering the
      // face as 700 leaves 400-weight Hangul unmatched and fails the render.
      ...(fontData
        ? {
            fonts: [
              { name: "Noto Sans KR", data: fontData, style: "normal" as const },
            ],
          }
        : {}),
    },
  );
}

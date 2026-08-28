import { CSSProperties } from "react";

/**
 * The mochi (모찌) blob — motoo's core brand motif and the visual name for the
 * platform's virtual currency.
 *
 * ## Why this is an SVG that inherits `currentColor` (2026-08-28)
 *
 * It used to be a CSS blob: a `border-radius` shape filled with a radial +
 * linear gradient, plus two inset shadows faking a top light and a bottom shade.
 * The Bauhaus pass flattened it, and flattening broke it — replacing the
 * gradient with a hard-stop ellipse turned the soft highlight into a hard-edged
 * shape that ate the bottom of the blob. On `card`, `panel`, `coral-chip` and
 * `sand` that lower half merged straight into the background and what was left
 * read as a crescent; on `coral` the body vanished instead and only the
 * highlight showed.
 *
 * The underlying problem was never the shading, it was **fixed fills on
 * brand-adjacent backgrounds**. The mochi renders on white, three warm tints,
 * solid coral and near-black — any hard-coded colour collides with at least one
 * of them. `currentColor` cannot collide, because the surrounding text colour
 * was already chosen to be legible on that surface.
 *
 * So: one flat filled silhouette, coloured by context. Callers set the colour
 * with a text class the way they would for any glyph — `text-coral-deep` where
 * the mochi *is* the subject (a balance, a price), `text-coral-soft` for the
 * decorative floaters on empty states, nothing at all where inheriting the
 * body colour is right.
 */

/** 26x21 viewBox — the mochi's canonical aspect, unchanged from the CSS blob. */
const DOME =
  "M1 15.4C1 7.6 6.4 2 13 2s12 5.6 12 13.4c0 2.7-5.4 4.1-12 4.1S1 18.1 1 15.4Z";

export function Mochi({
  width,
  height,
  float = false,
  floatDuration = 5,
  floatDelay = 0,
  className = "",
  style,
}: {
  /**
   * Size in px. **Required, and the only way to size a mochi** — see the note
   * on className below. Deliberately not defaulted: the defaults used to be
   * 26x21, so forgetting them rendered a plausible-looking mochi at the wrong
   * size instead of failing, which is exactly how the landing page shipped a
   * 26x21 blob crammed into a 28px circle.
   */
  width: number;
  height: number;
  float?: boolean;
  floatDuration?: number;
  floatDelay?: number;
  /**
   * Colour (`text-*`) and positioning (`absolute`, `self-end`, …). **Sizing
   * utilities here do nothing** — width/height are attributes and the element
   * is sized by them; dev builds warn if you try.
   */
  className?: string;
  style?: CSSProperties;
}) {
  if (
    process.env.NODE_ENV !== "production" &&
    /(^|\s)(w-|h-|size-)/.test(className)
  ) {
    console.warn(
      `[Mochi] A sizing class in className is ignored — size comes from the ` +
        `width/height props. Got: "${className}"`,
    );
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={width}
      height={height}
      viewBox="0 0 26 21"
      fill="none"
      style={{
        // No hardcoded `position` here: decorative mochis pass `absolute` (+
        // left/top) via className, and an inline position would override it,
        // trapping them in normal flow on top of the text. Inline mochis are
        // unaffected (static == relative with no offsets). Callers can still set
        // position through the `style` prop (spread below).
        flex: "none",
        animation: float
          ? `floaty ${floatDuration}s ease-in-out ${floatDelay}s infinite`
          : undefined,
        ...style,
      }}
    >
      <path d={DOME} fill="currentColor" />
    </svg>
  );
}

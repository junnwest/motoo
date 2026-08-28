import { CSSProperties } from "react";

/**
 * The mochi (모찌) blob — motoo's core brand motif and the visual name for the
 * platform's virtual currency ("cookies" in the spec, "모찌" in Korean copy).
 * Gradient + shape ported verbatim from the design handoff `.mochi` class.
 */
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
   * Positioning and layout only (`absolute`, `self-end`, …). **Sizing utilities
   * here do nothing** — width/height are written as inline styles below and
   * inline styles beat Tailwind classes. Dev builds warn if you try.
   */
  className?: string;
  style?: CSSProperties;
}) {
  if (process.env.NODE_ENV !== "production" && /(^|\s)(w-|h-|size-)/.test(className)) {
    console.warn(
      `[Mochi] A sizing class in className is ignored — width/height are inline ` +
        `styles and win. Pass the width/height props instead. Got: "${className}"`,
    );
  }

  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        // No hardcoded `position` here: decorative mochis pass `absolute` (+
        // left/top) via className, and an inline position would override it,
        // trapping them in normal flow on top of the text. Inline mochis are
        // unaffected (static == relative with no offsets). Callers can still set
        // position through the `style` prop (spread below).
        display: "inline-block",
        width,
        height,
        flex: "none",
        // Flat, two-tone (2026-08-28, the Bauhaus pass). Was a radial + linear
        // gradient from the design handoff, plus two inset shadows faking a top
        // light and a bottom shade — a soft 3D blob, which is the opposite of a
        // flat system and went muddy at the 16-24px it actually renders at.
        // Same silhouette, all shading gone: one solid body, one hard highlight.
        background:
          "radial-gradient(ellipse 46% 38% at 50% 78%, var(--color-cream-warm) 0 100%, transparent 100%), var(--color-coral-tint)",
        borderRadius: "47% 47% 49% 49%/57% 57% 43% 43%",
        animation: float
          ? `floaty ${floatDuration}s ease-in-out ${floatDelay}s infinite`
          : undefined,
        ...style,
      }}
    />
  );
}

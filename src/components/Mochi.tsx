import { CSSProperties } from "react";

/**
 * The mochi (모찌) blob — motoo's core brand motif and the visual name for the
 * platform's virtual currency ("cookies" in the spec, "모찌" in Korean copy).
 * Gradient + shape ported verbatim from the design handoff `.mochi` class.
 */
export function Mochi({
  width = 26,
  height = 21,
  float = false,
  floatDuration = 5,
  floatDelay = 0,
  className = "",
  style,
}: {
  width?: number;
  height?: number;
  float?: boolean;
  floatDuration?: number;
  floatDelay?: number;
  className?: string;
  style?: CSSProperties;
}) {
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
        background:
          "radial-gradient(ellipse 50% 42% at 50% 80%, #FFFDF8 0%, #F5E4D2 58%, rgba(245,228,210,0) 62%), linear-gradient(158deg,#F3B49B,#E2855F)",
        borderRadius: "47% 47% 49% 49%/57% 57% 43% 43%",
        boxShadow:
          "inset 0 4px 6px rgba(255,255,255,.5), inset 0 -5px 9px rgba(168,90,64,.32)",
        animation: float
          ? `floaty ${floatDuration}s ease-in-out ${floatDelay}s infinite`
          : undefined,
        ...style,
      }}
    />
  );
}

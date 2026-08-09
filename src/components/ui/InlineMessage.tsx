import { ReactNode } from "react";

/**
 * Form-level feedback: the line that appears under a form after it succeeds or
 * fails. Thirteen hand-rolled copies of this existed, and they had drifted
 * across four font sizes (13 / 13.5 / 14 / 12.5px) and two weights.
 *
 * Two things it fixes beyond the duplication:
 *
 * 1. **`role="alert"`.** None of the originals had it, so a screen-reader user
 *    submitting a form got no announcement at all — the message simply appeared
 *    for sighted users and silently for everyone else. That's a WCAG 4.1.3
 *    failure on every form in the product, and it's the kind of thing that has
 *    to be built into the primitive or it never gets remembered.
 * 2. **One size, deliberately.** The drift resolved to `13.5px`/semibold, which
 *    was already the most common. *Field-level* errors are a different thing and
 *    stay smaller (12.5px) — see `Field` — because they sit under a single input
 *    rather than summarising the whole form. That distinction is real, so it's
 *    preserved; the rest of the variation was accidental and isn't.
 *
 * Callers that were at 13px or 14px shift by half a pixel. That is the intended
 * consequence of consolidating, not an oversight.
 */
export function InlineMessage({
  tone,
  children,
  className = "",
}: {
  tone: "error" | "success";
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      // Errors interrupt; successes wait for a pause. Both are announced.
      role={tone === "error" ? "alert" : "status"}
      className={`text-sm font-semibold ${
        tone === "error" ? "text-live" : "text-sage"
      } ${className}`}
    >
      {children}
    </p>
  );
}

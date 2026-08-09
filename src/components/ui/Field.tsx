import { ComponentProps, ReactNode, useId } from "react";
import { IconChevronDown } from "@/components/ui/Icons";

/**
 * Form primitives: `Field` (the label / hint / error scaffold) and the three
 * controls that sit in it — `Input`, `Textarea`, `Select`.
 *
 * **Why these exist.** Before this, seven files declared a byte-identical
 * `inputClass` and six declared a byte-identical `labelClass`, and the copies
 * had already drifted: three carried `transition` on focus and four didn't.
 * Thirty-two inputs, nine selects and thirty-eight labels were wired by hand,
 * which also meant every one of them re-implemented (or, mostly, skipped) the
 * accessibility plumbing.
 *
 * **What they add beyond deduplication.** `Field` generates one id and wires
 * `htmlFor`, `aria-describedby` (hint *and* error), and `aria-invalid` for
 * free, and gives the error `role="alert"` so it's announced rather than just
 * shown. None of that was present anywhere before, and Stage 3's WCAG pass
 * depends on it being automatic rather than remembered.
 *
 * **Visual parity is deliberate.** The class strings below are the ones the
 * duplicated constants already used, kept verbatim so extracting them changes
 * nothing on screen. The one reconciliation is `transition`, now always on: it
 * only affects how the focus border animates between states, never a static
 * frame, so screenshots match either way.
 *
 * Grouped in one file, like `Button`/`ButtonLink`: they're a single cohesive
 * unit and callers almost always want more than one.
 */

const CONTROL_BASE =
  "w-full rounded-md border border-line-3 bg-white px-4 py-3 text-base outline-none transition focus:border-coral/60";

/** Compact variant for filter-bar controls, which aren't full-width fields. */
const CONTROL_SM =
  "rounded-md border border-line-3 bg-white px-3 py-[10px] text-sm font-medium text-ink outline-none transition focus:border-coral";

/**
 * Exported for *group* labels only — a set of choice tiles (thumbnail picker,
 * fulfillment picker) that reads as one labelled field but has no single
 * control for `htmlFor` to point at. Use `Field`/`Input`/`Select`/`Textarea`
 * anywhere there is a control; reaching for this string directly on one is the
 * duplication this file exists to end.
 */
export const FIELD_LABEL_CLASS =
  "mb-1.5 block text-xs font-semibold text-muted-2";

const LABEL_CLASS = FIELD_LABEL_CLASS;

/** Border treatment when a field is in error. Additive — nothing else moves. */
const CONTROL_INVALID = "border-live focus:border-live";

type FieldOwnProps = {
  /** Visible label. Omit only when an `aria-label` is supplied on the control. */
  label?: string;
  /** Helper text under the control. Announced via aria-describedby. */
  hint?: ReactNode;
  /** Error text. Sets aria-invalid, gets role="alert", replaces nothing. */
  error?: ReactNode;
  className?: string;
};

/**
 * Label + control + hint/error, with the ids wired up.
 *
 * Takes a render prop rather than plain children so the control receives the
 * generated ids without `cloneElement` — cloning silently breaks the moment a
 * caller wraps their input in anything, and this stays explicit about what's
 * being injected.
 */
export function Field({
  label,
  hint,
  error,
  className = "",
  children,
}: FieldOwnProps & {
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {/* A div, not a p: hints are sometimes richer than a sentence (the signup
          password requirements are a wrapped list of chips), and nesting those
          in a <p> is invalid HTML. Tailwind's preflight zeroes paragraph margins
          anyway, so the two render identically. */}
      {hint && (
        <div id={hintId} className="mt-1.5 text-xs text-muted">
          {hint}
        </div>
      )}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 text-xs font-semibold text-live"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  label,
  hint,
  error,
  className = "",
  fieldClassName = "",
  ...props
}: FieldOwnProps & { fieldClassName?: string } & ComponentProps<"input">) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      {(a11y) => (
        <input
          {...a11y}
          {...props}
          className={`${CONTROL_BASE} ${error ? CONTROL_INVALID : ""} ${className}`}
        />
      )}
    </Field>
  );
}

export function Textarea({
  label,
  hint,
  error,
  className = "",
  fieldClassName = "",
  resize = "none",
  ...props
}: FieldOwnProps & {
  fieldClassName?: string;
  /** Textareas differ on this in practice — item descriptions allow drag. */
  resize?: "none" | "y";
} & ComponentProps<"textarea">) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      {(a11y) => (
        <textarea
          {...a11y}
          {...props}
          className={`${CONTROL_BASE} ${resize === "y" ? "resize-y" : "resize-none"} ${error ? CONTROL_INVALID : ""} ${className}`}
        />
      )}
    </Field>
  );
}

export function Select({
  label,
  hint,
  error,
  className = "",
  fieldClassName = "",
  size = "md",
  children,
  ...props
}: FieldOwnProps & {
  fieldClassName?: string;
  /** "sm" is the compact filter-bar treatment used on /explore. */
  size?: "md" | "sm";
  // Native `size` on a <select> renders it as a multi-row listbox — not a look
  // this design system has, and it collides with the padding variant above
  // (string vs number). Dropped so `size` means the same thing here as on Button.
} & Omit<ComponentProps<"select">, "size">) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      className={fieldClassName}
    >
      {(a11y) => (
        // The OS's own arrow is hidden and the design system's chevron drawn in
        // its place — a native select arrow is the one control that can't take
        // brand color and shifts per platform. `pr-9` reserves the room for it.
        <div className="relative">
          <select
            {...a11y}
            {...props}
            className={`appearance-none pr-9 ${size === "sm" ? CONTROL_SM : CONTROL_BASE} ${error ? CONTROL_INVALID : ""} ${className}`}
          >
            {children}
          </select>
          <IconChevronDown
            width={16}
            height={16}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
      )}
    </Field>
  );
}

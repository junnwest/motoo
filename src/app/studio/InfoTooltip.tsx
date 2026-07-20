"use client";

/**
 * A small "i" button that reveals a bullet list of help text on hover/focus.
 * Used in a section header to keep guidance out of the form itself. Content is
 * passed in already-translated (the parent is a server component with next-intl).
 */
export function InfoTooltip({
  items,
  label,
}: {
  items: string[];
  /** Accessible label for the trigger (e.g. "도움말"). */
  label: string;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label}
        className="flex h-6 w-6 items-center justify-center rounded-full border border-line-3 text-[12px] font-bold italic text-muted-2 transition-colors hover:border-coral hover:text-coral-deep focus:outline-none focus-visible:border-coral"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-8 z-20 hidden w-[280px] rounded-[12px] border border-line-2 bg-card p-4 text-left shadow-card group-hover:block group-focus-within:block"
      >
        <ul className="flex flex-col gap-2 text-[13px] leading-relaxed text-body">
          {items.map((item, i) => (
            <li key={i} className="flex gap-1.5">
              <span aria-hidden="true" className="text-coral-deep">
                •
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </span>
    </span>
  );
}

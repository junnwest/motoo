import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "onCoral";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-bold rounded-lg transition-transform duration-150 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

/**
 * Pending spinner. `currentColor` so it inherits each variant's text color
 * rather than needing a per-variant rule, and `aria-hidden` because the busy
 * state is announced via `aria-busy` on the button itself.
 */
function Spinner() {
  return (
    <svg
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const variants: Record<Variant, string> = {
  // The coral glow was 10px down / 24px blur at .34 — a halo that size reads as
  // a toy button. Same colour, half the presence (the --shadow-coral token).
  primary: "bg-coral text-white shadow-coral hover:brightness-[1.03]",
  secondary:
    "bg-white text-ink border-[1.5px] border-line-3 hover:border-coral/60",
  dark: "bg-ink text-cream hover:brightness-125",
  ghost: "bg-transparent text-ink hover:bg-black/[.04]",
  onCoral:
    "bg-white/[.16] text-white border-[1.5px] border-white/50 hover:bg-white/25",
};

// Control heights, roughly 38px and 46px. They were 46 and 60 — a 60px primary
// button is a landing-page hero control, not a UI one, and using it everywhere
// is most of what made the app read as oversized.
const sizes: Record<Size, string> = {
  md: "px-4 py-2.5 text-base",
  lg: "px-6 py-3 text-lg",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  children,
  ...props
}: CommonProps & {
  /**
   * In-flight state. Shows a spinner, disables the button, and sets
   * `aria-busy` so the wait is announced rather than only drawn.
   *
   * Callers were doing `disabled={pending}` and swapping the label
   * ("결제하기" → "결제 중…"), which left no visual motion and nothing for a
   * screen reader. Keep swapping the label if it's useful — this adds the
   * affordance the label alone can't provide.
   */
  loading?: boolean;
} & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className = "",
  href,
  children,
}: CommonProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

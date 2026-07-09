import Link from "next/link";
import { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "onCoral";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 font-bold rounded-[14px] transition-transform duration-150 active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2";

const variants: Record<Variant, string> = {
  primary:
    "bg-coral text-white shadow-[0_10px_24px_rgba(224,138,111,.34)] hover:brightness-[1.03]",
  secondary:
    "bg-white text-ink border-[1.5px] border-line-3 hover:border-coral/60",
  dark: "bg-ink text-cream hover:brightness-125",
  ghost: "bg-transparent text-ink hover:bg-black/[.04]",
  onCoral:
    "bg-white/[.16] text-white border-[1.5px] border-white/50 hover:bg-white/25",
};

const sizes: Record<Size, string> = {
  md: "px-5 py-3 text-[15px]",
  lg: "px-[30px] py-[17px] text-[17px]",
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
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
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

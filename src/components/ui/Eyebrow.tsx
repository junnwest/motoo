import { ReactNode } from "react";

/** Mono uppercase section label used throughout the design (e.g. "how it works"). */
export function Eyebrow({
  children,
  tone = "coral",
  className = "",
}: {
  children: ReactNode;
  tone?: "coral" | "onDark";
  className?: string;
}) {
  const color = tone === "onDark" ? "text-coral-tint" : "text-coral-deep";
  return (
    <div
      className={`text-xs font-semibold uppercase tracking-[0.08em] ${color} ${className}`}
    >
      {children}
    </div>
  );
}

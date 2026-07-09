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
      className={`font-mono text-[13px] tracking-[0.2em] uppercase font-medium ${color} ${className}`}
    >
      {children}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import { SignupModal } from "./SignupModal";

type Variant = "primary" | "secondary" | "dark" | "ghost" | "onCoral";
type Size = "md" | "lg";

/**
 * A single 회원가입 button that opens the role-chooser modal (후원자 / 크리에이터)
 * instead of forking the CTA into two links. Used in the nav and on the login
 * page. The landing hero routes to the two flows directly, so it doesn't need it.
 */
export function SignupButton({
  label,
  variant = "primary",
  size = "md",
  className,
}: {
  label: string;
  variant?: Variant;
  size?: Size;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        {label}
      </Button>
      <SignupModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

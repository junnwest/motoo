import { SVGProps } from "react";

/**
 * Minimal line-icon set (Feather/Lucide-style: 24px grid, 2px stroke, round
 * caps, currentColor). Used for the fan-landing benefit cards in place of emoji
 * so each card carries a distinct, intentional mark that inherits brand color.
 */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconSend(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" />
    </Icon>
  );
}

export function IconGift(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9" />
      <path d="M12 8v13" />
      <path d="M12 8S12 3.5 8.5 3.5 5.5 6.5 5.5 8m6.5 0s0-4.5 3.5-4.5S18.5 6.5 18.5 8" />
    </Icon>
  );
}

export function IconAward(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14 7 22l5-3 5 3-1.5-8" />
    </Icon>
  );
}

export function IconDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="8" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="11" width="7" height="10" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </Icon>
  );
}

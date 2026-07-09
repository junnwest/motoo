import Link from "next/link";
import { Mochi } from "./Mochi";

export function BrandLogo({
  href = "/",
  onDark = false,
}: {
  href?: string;
  onDark?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-[10px]">
      <Mochi width={26} height={21} />
      <span
        className={`text-[24px] font-extrabold tracking-[-0.04em] ${
          onDark ? "text-cream" : "text-ink"
        }`}
      >
        motoo
      </span>
    </Link>
  );
}

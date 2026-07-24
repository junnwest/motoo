import Link from "next/link";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { Mochi } from "./Mochi";

/**
 * Placeholder for surfaces outside the v1 build scope (login, signup, apply,
 * full report, dashboard, admin). Keeps nav links from dead-ending.
 */
export function ComingSoon({
  title,
  body,
  variant = "fan",
}: {
  title: string;
  body: string;
  variant?: "fan" | "creator";
}) {
  return (
    <>
      <Nav />
      <section className="mx-auto flex max-w-[560px] flex-1 flex-col items-center px-6 py-28 text-center">
        <div className="mb-5 flex gap-2">
          <Mochi width={40} height={33} float />
          <Mochi width={52} height={42} float floatDelay={0.4} />
        </div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{title}</h1>
        <p className="mt-3 text-[16px] leading-[1.6] text-body">{body}</p>
        <Link
          href={variant === "creator" ? "/creators" : "/"}
          className="mt-8 rounded-[14px] bg-ink px-6 py-3 text-[15px] font-bold text-cream"
        >
          ← {variant === "creator" ? "motoo for creators" : "motoo"}
        </Link>
      </section>
      <Footer variant={variant} />
    </>
  );
}

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Mochi } from "@/components/Mochi";

/**
 * App-wide 404. Rendered inside the root layout, so unlike `error.tsx` this can
 * be a server component with the full nav and footer — a user who mistyped a
 * URL still has somewhere to go, and the page they land on looks like the rest
 * of the product.
 *
 * Next serves this with a real 404 status, which is the point: `/s/[handle]`
 * used to render its own "not found" body at HTTP 200, so every typo'd or
 * deleted handle was indexable as a live page.
 */
export default async function NotFound() {
  const t = await getTranslations("errorPage");

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto flex min-h-[60vh] w-full max-w-[560px] flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-5 flex items-end gap-2">
          <Mochi width={38} height={31} float />
          <Mochi width={50} height={41} float floatDelay={0.5} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink break-keep sm:text-3xl">
          {t("notFoundTitle")}
        </h1>
        <p className="mt-3 max-w-[420px] text-base leading-relaxed text-body break-keep">
          {t("notFoundBody")}
        </p>
        <Link
          href="/"
          className="mt-8 rounded-lg bg-ink px-6 py-3 text-base font-bold text-cream transition-transform duration-150 active:scale-[.98]"
        >
          {t("notFoundCta")}
        </Link>
      </main>
      <Footer variant="fan" />
    </>
  );
}

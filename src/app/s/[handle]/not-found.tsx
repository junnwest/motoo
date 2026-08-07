import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ConsumerShell } from "@/components/ConsumerShell";
import { Footer } from "@/components/Footer";
import { IconSearch } from "@/components/ui/Icons";

/**
 * 404 for an unknown creator handle — the copy the profile page used to render
 * inline at HTTP 200. Moving it here is what makes the status code honest:
 * `getStreamerProfile` returning null now calls `notFound()`, Next renders this,
 * and crawlers stop indexing dead handles as live pages.
 *
 * Keeps `ConsumerShell` so a signed-in user still has their rails — a mistyped
 * handle shouldn't strip the app frame off around them. The CTA points at
 * `/explore` rather than home: someone who reached a creator URL was looking for
 * a creator, and browse is the nearest useful thing.
 */
export default async function CreatorNotFound() {
  const t = await getTranslations("profile");

  return (
    <>
      <ConsumerShell>
        <section className="mx-auto flex max-w-[600px] flex-col items-center px-6 py-32 text-center">
          <IconSearch width={44} height={44} className="mb-4 text-muted" />
          <h1 className="text-[26px] font-extrabold break-keep">
            {t("notFoundTitle")}
          </h1>
          <p className="mt-3 text-[16px] text-body break-keep">
            {t("notFoundBody")}
          </p>
          <Link
            href="/explore"
            className="mt-8 rounded-[12px] bg-ink px-5 py-3 text-[14px] font-bold text-cream transition-transform duration-150 active:scale-[.98]"
          >
            {t("backToExplore")}
          </Link>
        </section>
      </ConsumerShell>
      <Footer variant="fan" />
    </>
  );
}

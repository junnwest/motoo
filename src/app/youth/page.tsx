import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("youth.title");
  const description = t("youth.description");
  return {
    title,
    description,
    alternates: { canonical: "/youth" },
    openGraph: { url: "/youth", title, description },
  };
}

/**
 * 청소년보호정책 (docs/PRELAUNCH.md #9). Conventional for a KR platform that
 * admits minors at all, and this one does more than admit them — it has a
 * minor/guardian-consent branch in the money path, which means it was already
 * making claims about minors with no page stating them.
 *
 * Written to describe what the code actually does, not what a template says a
 * policy should contain. That is why §3 admits there is no upload-time review:
 * a policy that overstates its own enforcement is worse than a short one, and
 * the report-then-act model is the honest description of PRELAUNCH #12/#15.
 *
 * Sections carrying a `note` are the ones with a qualifier that keeps the rule
 * honest — the same structure as /refund, and the two must not disagree, since
 * /refund is the single source of truth for refund copy (CLAUDE.md).
 */
const SECTIONS: { id: string; note?: boolean }[] = [
  { id: "basis" },
  { id: "payment", note: true },
  { id: "content", note: true },
  { id: "report" },
  { id: "officer" },
  { id: "help" },
];

export default async function YouthPage() {
  const t = await getTranslations("youth");
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[720px] flex-1 px-6 py-16">
        <h1 className="break-keep text-3xl font-extrabold tracking-[-0.02em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 text-2xs tabular-nums tracking-[0.04em] text-muted">
          {t("updated")}
        </p>
        <p className="mt-6 break-keep text-base leading-relaxed text-body">
          {t("intro")}
        </p>

        <div className="mt-10 flex flex-col gap-9">
          {SECTIONS.map((s) => (
            <div key={s.id}>
              <h2 className="break-keep text-lg font-bold tracking-[-0.01em] text-ink">
                {t(`${s.id}.title`)}
              </h2>
              <p className="mt-3 break-keep text-base leading-relaxed text-body">
                {t(`${s.id}.body`)}
              </p>
              {s.note ? (
                <p className="mt-3 break-keep border-l-2 border-line-2 pl-4 text-sm leading-relaxed text-muted">
                  {t(`${s.id}.note`)}
                </p>
              ) : null}
              {/* The 책임자 section is a contact section — it is only worth
                  anything if it carries a reachable address, so it renders one
                  or, if SUPPORT_EMAIL is ever unset, nothing at all rather than
                  a heading promising a channel that isn't there. */}
              {s.id === "officer" && SUPPORT_EMAIL ? (
                <p className="mt-3 text-base leading-relaxed text-muted">
                  <a
                    href={supportMailto()!}
                    className="font-semibold text-coral-deep underline"
                  >
                    {SUPPORT_EMAIL}
                  </a>
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <Link
          href="/"
          className="mt-12 inline-block text-sm font-semibold text-coral-deep hover:underline"
        >
          ← {t("back")}
        </Link>
      </main>
      <Footer variant="fan" />
    </>
  );
}

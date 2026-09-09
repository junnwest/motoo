import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("guidelines.title");
  const description = t("guidelines.description");
  return {
    title,
    description,
    alternates: { canonical: "/guidelines" },
    openGraph: { url: "/guidelines", title, description },
  };
}

/**
 * 마켓 운영정책 — what a creator may sell, and what happens when they don't.
 *
 * These rules were already decided and already enforced: the admin takedown
 * (`hiddenAt`), creator suspension (`StreamerStatus.suspended`) and the report
 * flow all act on them. They just were not written down anywhere a creator
 * could read — they lived in `docs/PROGRESS.md`, an internal file. Enforcing a
 * rule you have not published is the wrong way round, and it is the one gap
 * both comparable Korean platforms fill (텀블벅's 프로젝트 심사 기준,
 * 투네이션's 운영정책).
 *
 * Same structure as /youth and /refund: short sections, and a `note` wherever a
 * rule needs a qualifier to stay honest. The qualifiers matter more here than
 * anywhere else, because the three easy overstatements are all tempting —
 * that we review items before they appear (we do not; registration
 * auto-approves and the model is report-then-act), that motoo delivers
 * anything (the creator is the seller; fulfilment is off-platform for now),
 * and that this page decides refunds (it does not — /refund is the single
 * source of truth, so this one points at it rather than restating it, which is
 * exactly the contradiction that shipped once before).
 */
const SECTIONS: { id: string; note?: boolean }[] = [
  { id: "scope" },
  { id: "allowed", note: true },
  { id: "disallowed" },
  { id: "fulfillment", note: true },
  { id: "enforcement", note: true },
  { id: "refund" },
  { id: "help" },
];

/** The four item types, mirroring MarketplaceItemType. */
const ITEM_TYPES = ["digital", "access", "physical", "session"] as const;

/** The four things a market may never sell. */
const BANS = ["money", "resale", "chance", "restricted"] as const;

export default async function GuidelinesPage() {
  const t = await getTranslations("guidelines");
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

              {/* The two lists are the substance of the page, so they are laid
                  out as lists rather than folded into prose. Each row is a
                  label and the concrete examples it covers — the labels match
                  MarketplaceItemType so the page and the editor agree. */}
              {s.id === "allowed" ? (
                <ul className="mt-4 flex flex-col divide-y divide-line-2 border-y border-line-2">
                  {ITEM_TYPES.map((k) => (
                    <li key={k} className="py-3">
                      <span className="text-sm font-bold text-ink">
                        {t(`allowed.types.${k}.label`)}
                      </span>
                      <span className="mt-1 block break-keep text-sm leading-relaxed text-muted">
                        {t(`allowed.types.${k}.examples`)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {s.id === "disallowed" ? (
                <ul className="mt-4 flex flex-col divide-y divide-line-2 border-y border-line-2">
                  {BANS.map((k) => (
                    <li key={k} className="py-3">
                      <span className="text-sm font-bold text-ink">
                        {t(`disallowed.bans.${k}.label`)}
                      </span>
                      <span className="mt-1 block break-keep text-sm leading-relaxed text-muted">
                        {t(`disallowed.bans.${k}.body`)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {s.note ? (
                <p className="mt-3 break-keep border-l-2 border-line-2 pl-4 text-sm leading-relaxed text-muted">
                  {t(`${s.id}.note`)}
                </p>
              ) : null}

              {/* /refund is the single source of truth for refund copy, so this
                  section links there instead of repeating the rules. */}
              {s.id === "refund" ? (
                <p className="mt-3 text-base leading-relaxed">
                  <Link
                    href="/refund"
                    className="font-semibold text-coral-deep underline"
                  >
                    {t("refund.link")}
                  </Link>
                </p>
              ) : null}

              {s.id === "help" && SUPPORT_EMAIL ? (
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

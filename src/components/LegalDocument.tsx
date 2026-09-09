import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

/**
 * One section of a legal document — a 조 of the 약관, or a 항 of the 방침.
 *
 * `body` is the lead paragraph and `items` the numbered clauses under it;
 * either may be omitted, because real 조문 come in both shapes. `note` renders
 * in the indented, quieter style /youth, /refund and /guidelines use for a
 * qualifier that keeps a rule honest.
 */
export type LegalSection = {
  title: string;
  body?: string;
  items?: string[];
  note?: string;
};

/**
 * Whether `legal.<doc>` is published but not yet signed off.
 *
 * A draft is still the better thing to publish than a placeholder — a
 * 개인정보처리방침 is a standing obligation and an unreviewed one describes
 * real practice, while "데모용 자리표시 문서예요" describes nothing. But it
 * should not be the version a search engine keeps: `/terms` and `/privacy` are
 * publicly reachable and robots explicitly allows crawling them, so a draft
 * would be indexed, cached, and outlive itself. Pages call this from
 * `generateMetadata` to set NOINDEX for exactly as long as the flag is set.
 */
export async function isDraftLegalDocument(
  doc: "terms" | "privacy",
): Promise<boolean> {
  const t = await getTranslations("legal");
  return t.has(`${doc}.draft`) && t.raw(`${doc}.draft`) === true;
}

/**
 * The shared frame for `/terms` and `/privacy`.
 *
 * Both pages were a heading and one paragraph saying the document did not
 * exist yet, which is honest but is not something a 14-조 약관 can be dropped
 * into. This renders the document when there is one and the placeholder when
 * there is not, so the day counsel returns text it is a content change in
 * `messages/ko.json` and no code change at all.
 *
 * The message shape it expects, under `legal.<doc>`:
 *
 *   "terms": {
 *     "updated": "시행일 2026-10-01",
 *     "intro": "...",
 *     "sections": [
 *       { "title": "제1조 (목적)", "body": "...", "items": ["...", "..."] },
 *       { "title": "제8조 (환불)", "body": "...", "note": "..." }
 *     ]
 *   }
 *
 * `updated`, `intro`, `body`, `items` and `note` are each optional; an absent
 * or empty `sections` falls back to the placeholder. Deliberately data rather
 * than JSX: the section list belongs to whoever writes the document, not to
 * whoever last edited a component, and it keeps every word inside the catalog
 * `pnpm check:vocab` scans.
 *
 * Section titles carry their own numbering ("제1조", "3.") rather than being
 * numbered by the renderer — 약관 and 방침 number differently, and a document
 * whose numbering is generated cannot be quoted reliably in a dispute.
 */
export async function LegalDocument({ doc }: { doc: "terms" | "privacy" }) {
  const t = await getTranslations("legal");

  const raw = t.has(`${doc}.sections`) ? t.raw(`${doc}.sections`) : null;
  const sections: LegalSection[] = Array.isArray(raw) ? raw : [];
  const hasDocument = sections.length > 0;

  const updated = t.has(`${doc}.updated`) ? t(`${doc}.updated`) : "";
  const intro = t.has(`${doc}.intro`) ? t(`${doc}.intro`) : "";
  // A document published before counsel has signed it off. Says so at the top,
  // and `isDraftLegalDocument` keeps it out of search results — see that
  // helper. Delete the flag when the reviewed text lands and both go away.
  const isDraft = t.has(`${doc}.draft`) && t.raw(`${doc}.draft`) === true;

  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[720px] flex-1 px-6 py-16">
        <h1 className="break-keep text-3xl font-extrabold tracking-[-0.02em] text-ink">
          {t(`${doc}Title`)}
        </h1>

        {hasDocument ? (
          <>
            {updated ? (
              <p className="mt-2 text-2xs tabular-nums tracking-[0.04em] text-muted">
                {updated}
              </p>
            ) : null}
            {isDraft ? (
              <p className="mt-5 break-keep border border-line-2 bg-panel px-4 py-3 text-sm leading-relaxed text-body">
                {t("draftNotice")}
              </p>
            ) : null}
            {intro ? (
              <p className="mt-6 break-keep text-base leading-relaxed text-body">
                {intro}
              </p>
            ) : null}

            <div className="mt-10 flex flex-col gap-9">
              {sections.map((s) => (
                <div key={s.title}>
                  <h2 className="break-keep text-lg font-bold tracking-[-0.01em] text-ink">
                    {s.title}
                  </h2>
                  {s.body ? (
                    <p className="mt-3 break-keep text-base leading-relaxed text-body">
                      {s.body}
                    </p>
                  ) : null}
                  {s.items?.length ? (
                    <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5">
                      {s.items.map((item) => (
                        <li
                          key={item}
                          className="break-keep text-base leading-relaxed text-body"
                        >
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {s.note ? (
                    <p className="mt-3 break-keep border-l-2 border-line-2 pl-4 text-sm leading-relaxed text-muted">
                      {s.note}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 break-keep text-base leading-relaxed text-body">
            {t("placeholder")}
          </p>
        )}

        {/* Home, not /onboarding. These pages are reached from the footer far
            more often than from the consent checkbox, and the consent links
            open in a new tab, so there is no onboarding session behind this
            link to return to. Matches /youth, /refund and /guidelines. */}
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

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  LegalDocument,
  isDraftLegalDocument,
} from "@/components/LegalDocument";
import { NOINDEX } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("terms.title");
  const description = t("terms.description");
  return {
    title,
    description,
    alternates: { canonical: "/terms" },
    openGraph: { url: "/terms", title, description },
    // Kept out of the index for exactly as long as the document is a draft.
    ...((await isDraftLegalDocument("terms")) ? { robots: NOINDEX } : {}),
  };
}

/**
 * 이용약관. Agreed to at onboarding, so it must be readable before signup and
 * stays in `PUBLIC_PREFIXES` for that reason.
 *
 * The document itself lives in `messages/ko.json` under `legal.terms` — see
 * LegalDocument for the shape. Until counsel returns text, `sections` is empty
 * and the page renders the placeholder. The lawyer-review draft is at
 * `docs/legal/terms-draft.md` (제1조–제14조 + 부칙).
 */
export default function TermsPage() {
  return <LegalDocument doc="terms" />;
}

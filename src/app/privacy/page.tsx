import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  LegalDocument,
  isDraftLegalDocument,
} from "@/components/LegalDocument";
import { NOINDEX } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const title = t("privacy.title");
  const description = t("privacy.description");
  return {
    title,
    description,
    alternates: { canonical: "/privacy" },
    openGraph: { url: "/privacy", title, description },
    // Kept out of the index for exactly as long as the document is a draft.
    ...((await isDraftLegalDocument("privacy")) ? { robots: NOINDEX } : {}),
  };
}

/**
 * 개인정보처리방침. Publishing one is a standing obligation under
 * 개인정보보호법 for as long as the service processes personal data — which it
 * already does (본인인증 stores a name, birth year and gender), so this page
 * being a placeholder is a live gap rather than a launch-day task.
 *
 * The document lives in `messages/ko.json` under `legal.privacy` — see
 * LegalDocument for the shape. The lawyer-review draft is at
 * `docs/legal/privacy-draft.md` (1–11항 + 부칙), and `docs/legal/` also holds
 * the collection inventory the 수집 항목 section has to match.
 */
export default function PrivacyPage() {
  return <LegalDocument doc="privacy" />;
}

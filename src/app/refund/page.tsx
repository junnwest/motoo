import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SUPPORT_EMAIL, supportMailto } from "@/lib/support";

/**
 * The 환불·청약철회 policy. Ordered as a reader hits the questions: who is
 * actually the seller, then the three distinct paths money can come back —
 * an order reversed in mochi, a purchase withdrawn in KRW, an unused balance
 * cashed out — then the statutory carve-out that overrides all of them.
 *
 * `note` is the qualifier that keeps each rule honest (what it does NOT cover),
 * so only the three rule sections carry one.
 */
const SECTIONS: { id: string; note?: boolean }[] = [
  { id: "seller" },
  { id: "orderCancel", note: true },
  { id: "withdrawal", note: true },
  { id: "balance", note: true },
  { id: "legalException" },
  { id: "howTo" },
  { id: "noResale" },
];

export default async function RefundPage() {
  const t = await getTranslations("refund");
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto w-full max-w-[720px] flex-1 px-6 py-16">
        <h1 className="break-keep text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 font-mono text-[12px] tracking-[0.04em] text-muted">
          {t("updated")}
        </p>
        <p className="mt-6 break-keep text-[15px] leading-[1.7] text-body">
          {t("intro")}
        </p>

        <div className="mt-10 flex flex-col gap-9">
          {SECTIONS.map((s) => (
            <div key={s.id}>
              <h2 className="break-keep text-[17px] font-bold tracking-[-0.01em] text-ink">
                {t(`${s.id}.title`)}
              </h2>
              <p className="mt-3 break-keep text-[15px] leading-[1.7] text-body">
                {t(`${s.id}.body`)}
              </p>
              {s.note ? (
                <p className="mt-3 break-keep border-l-2 border-line-2 pl-4 text-[14px] leading-[1.7] text-muted">
                  {t(`${s.id}.note`)}
                </p>
              ) : null}
              {/* The policy body names 고객센터; this is the address that
                  actually is it. Kept as its own line rather than interpolated
                  into the body so the counsel-sensitive copy stays untouched,
                  and so it simply disappears if SUPPORT_EMAIL is ever unset
                  instead of rendering "고객센터()로 신청해 주세요". */}
              {s.id === "howTo" && SUPPORT_EMAIL ? (
                <p className="mt-3 text-[15px] leading-[1.7] text-body">
                  {t("howTo.contact")}{" "}
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
          className="mt-12 inline-block text-[14px] font-semibold text-coral-deep hover:underline"
        >
          ← {t("back")}
        </Link>
      </main>
      <Footer variant="fan" />
    </>
  );
}

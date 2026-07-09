import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mochi } from "./Mochi";

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; underline?: boolean }[];
}) {
  return (
    <div>
      <div className="mb-[14px] font-mono text-[11px] tracking-[0.1em] text-dark-mono">
        {title}
      </div>
      <div className="flex flex-col gap-[10px] text-[14px] text-dark-text-2">
        {links.map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className={`hover:text-cream ${l.underline ? "underline" : ""}`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Footer({ variant = "fan" }: { variant?: "fan" | "creator" }) {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className="bg-ink px-6 pb-10 pt-14 text-dark-text-2 sm:px-14">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="max-w-[300px]">
            <div className="mb-[14px] flex items-center gap-[9px]">
              <Mochi width={24} height={19} />
              <span className="text-[22px] font-extrabold tracking-[-0.04em] text-cream">
                motoo
              </span>
            </div>
            <p className="text-[14px] leading-[1.6] text-dark-text-3">
              {variant === "creator" ? t("creatorTagline") : t("fanTagline")}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8">
            {variant === "creator" ? (
              <FooterCol
                title={t("colProduct")}
                links={[
                  { label: t("product.trustReport"), href: "/creators#report" },
                  {
                    label: t("product.creatorDashboard"),
                    href: "/dashboard",
                  },
                  { label: t("product.mochi"), href: "/#what-is-mochi" },
                  { label: tNav("forFans"), href: "/" },
                ]}
              />
            ) : (
              <FooterCol
                title={t("colExplore")}
                links={[
                  { label: t("explore.creators"), href: "/explore" },
                  { label: t("explore.categories"), href: "/explore" },
                  { label: t("explore.whatIsMochi"), href: "/#what-is-mochi" },
                  { label: tNav("forCreators"), href: "/creators" },
                ]}
              />
            )}

            <FooterCol
              title={variant === "creator" ? t("colCompany") : t("colSupport")}
              links={
                variant === "creator"
                  ? [
                      { label: t("company.about"), href: "#" },
                      { label: t("company.help"), href: "#" },
                      { label: t("company.notice"), href: "#" },
                    ]
                  : [
                      { label: t("support.help"), href: "#" },
                      { label: t("support.faq"), href: "#" },
                      { label: t("support.safety"), href: "#" },
                    ]
              }
            />

            <FooterCol
              title={t("colTerms")}
              links={[
                { label: t("terms.tos"), href: "#" },
                { label: t("terms.privacy"), href: "#" },
                { label: t("terms.refund"), href: "#", underline: true },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-dark-line pt-[18px] font-mono text-[11px] leading-[1.6] text-dark-mono">
          {t("businessInfo")}
          {variant === "fan" && (
            <>
              <br />
              {t("fanDisclosure")}
            </>
          )}
        </div>
      </div>
    </footer>
  );
}

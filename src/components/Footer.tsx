import Link from "next/link";
import { useTranslations } from "next-intl";
import { Mochi } from "./Mochi";
import { supportMailto } from "@/lib/support";

type FooterLink = {
  label: string;
  /** null = no destination configured; the link is dropped, never rendered dead. */
  href: string | null;
  underline?: boolean;
  /** mailto/external — rendered as <a>, since next/link is for app routes. */
  external?: boolean;
};

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  // Every link here used to be rendered unconditionally, including six with
  // href="#". A dead link labelled 고객센터 is worse than an absent one: it
  // reads as a working channel, and /refund points users at it. Anything
  // without a destination is now dropped instead.
  const live = links.filter((l): l is FooterLink & { href: string } => !!l.href);
  if (live.length === 0) return null;

  return (
    <div>
      <div className="mb-[14px] font-mono text-2xs tracking-[0.1em] text-dark-mono">
        {title}
      </div>
      <div className="flex flex-col gap-[10px] text-sm text-dark-text-2">
        {live.map((l) => {
          const className = `hover:text-cream ${l.underline ? "underline" : ""}`;
          return l.external ? (
            <a key={l.label} href={l.href} className={className}>
              {l.label}
            </a>
          ) : (
            <Link key={l.label} href={l.href} className={className}>
              {l.label}
            </Link>
          );
        })}
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
              <span className="text-xl font-extrabold tracking-[-0.04em] text-cream">
                motoo
              </span>
            </div>
            <p className="text-sm leading-relaxed text-dark-text-3">
              {variant === "creator" ? t("creatorTagline") : t("fanTagline")}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8">
            {variant === "creator" ? (
              <FooterCol
                title={t("colProduct")}
                links={[
                  { label: t("product.market"), href: "/creators#features" },
                  // `/dashboard` 404'd — that route has never existed. The
                  // creator console is /studio (forwarded to the studio
                  // subdomain by src/proxy.ts).
                  {
                    label: t("product.creatorDashboard"),
                    href: "/studio",
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

            {/* 고객센터 is the only one of these with a real destination, and
                only once SUPPORT_EMAIL is set (src/lib/support.ts). 소개 /
                공지사항 / 자주 묻는 질문 / 안전·신뢰 have no pages yet, so they
                are omitted rather than pointed at "#". */}
            <FooterCol
              title={variant === "creator" ? t("colCompany") : t("colSupport")}
              links={[
                {
                  label:
                    variant === "creator"
                      ? t("company.help")
                      : t("support.help"),
                  href: supportMailto(),
                  external: true,
                },
              ]}
            />

            <FooterCol
              title={t("colTerms")}
              links={[
                { label: t("terms.tos"), href: "/terms" },
                { label: t("terms.privacy"), href: "/privacy" },
                { label: t("terms.refund"), href: "/refund", underline: true },
              ]}
            />
          </div>
        </div>

        <div className="mt-10 border-t border-dark-line pt-[18px] font-mono text-2xs leading-relaxed text-dark-mono">
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

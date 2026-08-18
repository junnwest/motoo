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

/**
 * Two tones. `dark` is the marketing footer — a full-bleed ink band that ends
 * the landing, /creators and the legal pages, where it reads as the bottom of
 * the document. `light` is for inside `ConsumerShell`'s middle column, where a
 * black slab in a cream box looked like a foreign object rather than the end of
 * the page (2026-08-11).
 */
type Tone = "dark" | "light";

const TONE = {
  dark: {
    shell: "bg-ink text-dark-text-2",
    brand: "text-cream",
    tagline: "text-dark-text-3",
    colTitle: "text-dark-mono",
    links: "text-dark-text-2",
    linkHover: "hover:text-cream",
    rule: "border-dark-line",
    legal: "text-dark-mono",
  },
  light: {
    shell: "border-t border-line-2 text-body",
    brand: "text-ink",
    tagline: "text-muted",
    colTitle: "text-muted",
    links: "text-body",
    linkHover: "hover:text-coral-deep",
    rule: "border-line-2",
    legal: "text-muted",
  },
} as const satisfies Record<Tone, Record<string, string>>;

function FooterCol({
  title,
  links,
  tone,
}: {
  title: string;
  links: FooterLink[];
  tone: Tone;
}) {
  // Every link here used to be rendered unconditionally, including six with
  // href="#". A dead link labelled 고객센터 is worse than an absent one: it
  // reads as a working channel, and /refund points users at it. Anything
  // without a destination is now dropped instead.
  const live = links.filter(
    (l): l is FooterLink & { href: string } => !!l.href,
  );
  if (live.length === 0) return null;

  const c = TONE[tone];
  return (
    <div>
      <div
        className={`mb-[14px] font-mono text-2xs tracking-[0.1em] ${c.colTitle}`}
      >
        {title}
      </div>
      <div className={`flex flex-col gap-[10px] text-sm ${c.links}`}>
        {live.map((l) => {
          const className = `${c.linkHover} ${l.underline ? "underline" : ""}`;
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

export function Footer({
  variant = "fan",
  tone = "dark",
}: {
  variant?: "fan" | "creator";
  tone?: Tone;
}) {
  const c = TONE[tone];
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  return (
    <footer className={`px-6 pb-10 pt-14 sm:px-14 ${c.shell}`}>
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-wrap justify-between gap-10">
          <div className="max-w-[300px]">
            <div className="mb-[14px] flex items-center gap-[9px]">
              <Mochi width={24} height={19} />
              <span
                className={`text-xl font-extrabold tracking-[-0.04em] ${c.brand}`}
              >
                motoo
              </span>
            </div>
            <p className={`text-sm leading-relaxed ${c.tagline}`}>
              {variant === "creator" ? t("creatorTagline") : t("fanTagline")}
            </p>
          </div>

          <div className="flex flex-wrap gap-x-14 gap-y-8">
            {variant === "creator" ? (
              <FooterCol
                tone={tone}
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
                tone={tone}
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
              tone={tone}
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
              tone={tone}
              title={t("colTerms")}
              links={[
                { label: t("terms.tos"), href: "/terms" },
                { label: t("terms.privacy"), href: "/privacy" },
                { label: t("terms.refund"), href: "/refund", underline: true },
                { label: t("terms.youth"), href: "/youth" },
              ]}
            />
          </div>
        </div>

        <div
          className={`mt-10 border-t pt-[18px] font-mono text-2xs leading-relaxed ${c.rule} ${c.legal}`}
        >
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

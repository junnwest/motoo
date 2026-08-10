import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isProd = process.env.NODE_ENV === "production";

/**
 * Content-Security-Policy, shipped in **Report-Only** first.
 *
 * Enforcing straight away would break the app: Next injects inline bootstrap
 * scripts and Tailwind emits inline styles, so a strict policy needs a
 * per-request nonce threaded through the middleware. That's a bigger change
 * than this stage, and getting it wrong takes the site down rather than
 * degrading it. Report-Only gives us the violation reports with zero blast
 * radius; enforcement follows once the reports are quiet.
 *
 * The jsdelivr exception in `style-src`/`font-src` is **gone** (2026-08-10):
 * Pretendard is now self-hosted as a dynamic subset under
 * `public/fonts/pretendard/`, so no third-party origin is involved in rendering
 * text at all. What still blocks enforcement is `'unsafe-inline'`, which needs
 * the nonce work described above — not the font.
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // Uploaded images are data: URLs in Postgres (see src/lib/imageUpload.ts),
  // and OAuth providers serve avatars from their own hosts.
  "img-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline'" + (isProd ? "" : " 'unsafe-eval'"),
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  // NOT `upgrade-insecure-requests`: browsers ignore it in a Report-Only
  // policy and log a console error for it on every single page load. Add it
  // back in the same change that flips this header to enforcing, where it
  // actually does something. (HSTS already covers the prod case anyway.)
].join("; ");

const securityHeaders = [
  /**
   * HSTS — production only, since it's meaningless (and confusing) over plain
   * http on localhost. `includeSubDomains` is correct here: the only sibling
   * host is studio.themotoo.com, which is HTTPS on Vercel like the apex.
   *
   * Deliberately **no `preload`**. That directive is a request to be baked into
   * browsers' shipped preload lists, which takes months to reverse and would
   * strand any future subdomain that can't do HTTPS. It's a one-word change
   * whenever that's a decision someone wants to make on purpose.
   */
  ...(isProd
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
  // Clickjacking. The app is never framed; `frame-ancestors` above is the
  // modern equivalent, and this is the fallback for older browsers.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send the origin cross-site but the full path same-origin — enough for
  // referral analytics without leaking creator handles to third parties.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // motoo asks for none of these. 본인인증 happens at the 본인확인기관, not here.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  images: {
    /**
     * Was `hostname: "**"` — an open image proxy: any host on the internet
     * could be fetched and cached through `/_next/image`, which is a standard
     * SSRF/bandwidth-abuse vector. It bought nothing, because **`next/image` is
     * not used anywhere in the app** (avatars and item covers are data: URLs
     * rendered with plain `<img>`; see src/lib/imageUpload.ts).
     *
     * Narrowed to the OAuth avatar CDNs, which are the only remote images the
     * product has any reason to load. Add a host here deliberately if that
     * changes — never a wildcard.
     */
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.pstatic.net" },
      { protocol: "https", hostname: "*.kakaocdn.net" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      // The buy-mochi flow became the donate flow (mochi is a bonus, not
      // something sold) — see docs/DECISIONS.md, the donation-pivot entry.
      {
        source: "/s/:handle/buy",
        destination: "/s/:handle/donate",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

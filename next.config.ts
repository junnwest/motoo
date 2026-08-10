import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    // Placeholder avatars/thumbnails during v1 (design uses image-slot placeholders).
    remotePatterns: [{ protocol: "https", hostname: "**" }],
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

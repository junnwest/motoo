import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Why an invite link did not work.
 *
 * `/join/<token>` is a Route Handler (it has to set a cookie), so it cannot
 * render anything itself — it redirects here with `?e=`. Worth a page rather
 * than a bounce to `/`: "this link is invalid" and "this link was already used"
 * are different problems for the person holding it, and the second one has an
 * obvious next step (log in) that the first does not.
 */
const REASONS = ["unknown", "revoked", "spent"] as const;
type Reason = (typeof REASONS)[number];

export default async function JoinErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  const t = await getTranslations("prelaunch");
  const reason: Reason = REASONS.includes(e as Reason)
    ? (e as Reason)
    : "unknown";

  return (
    <>
      <Nav />
      <main id="main" className="px-6 py-24 sm:px-14">
        <div className="mx-auto max-w-[520px] border border-line-2 bg-card p-10 text-center shadow-soft">
          <h1 className="break-keep text-2xl font-extrabold tracking-[-0.02em]">
            {t(`joinError.${reason}Title`)}
          </h1>
          <p className="mt-3 break-keep text-base leading-relaxed text-body">
            {t(`joinError.${reason}Body`)}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/" variant="secondary" size="md">
              {t("backHome")}
            </ButtonLink>
            {reason === "spent" ? (
              <Link
                href="/login"
                className="text-sm font-semibold text-coral-deep hover:underline"
              >
                {t("joinError.spentLogin")}
              </Link>
            ) : null}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

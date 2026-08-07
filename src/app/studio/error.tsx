"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ErrorState";

/**
 * Studio-scoped error boundary. Same shell as the app-wide one, different copy
 * and a different escape hatch: a creator who hits this is on the studio
 * subdomain, where `/` is the console root, not the marketing landing.
 *
 * The reassurance in the body is deliberate — a creator seeing an error on the
 * page that manages their market and orders will assume the worst about their
 * data. Nothing here writes anything, so saying so is both true and the first
 * thing they want to know.
 */
export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    console.error("Unhandled studio error", error.digest ?? "", error);
  }, [error]);

  return (
    <ErrorState
      title={t("studioTitle")}
      body={t("studioBody")}
      retryLabel={t("retry")}
      homeLabel={t("home")}
      homeHref="/"
      referenceLabel={t("reference")}
      digest={error.digest}
      onRetry={reset}
    />
  );
}

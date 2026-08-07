"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { ErrorState } from "@/components/ErrorState";

/**
 * App-wide error boundary. Catches anything thrown while rendering a page or
 * running a server action below the root layout.
 *
 * Before this existed, any unhandled throw — a Prisma timeout, a Supabase blip
 * mid-purchase — rendered Next's own error screen: English, unstyled, no brand,
 * no way back. On a product that takes payments that reads as a dead site.
 *
 * The root layout still renders around this, so `NextIntlClientProvider` is in
 * scope and the copy is translated. (`global-error.tsx` replaces the layout and
 * therefore can't be — see the note there.)
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  useEffect(() => {
    // The server stack never reaches the browser — `digest` is the only handle
    // on it. Logging here at least puts it in the client console next to
    // whatever the user was doing. Stage 7 replaces this with real reporting.
    console.error("Unhandled app error", error.digest ?? "", error);
  }, [error]);

  return (
    <ErrorState
      title={t("title")}
      body={t("body")}
      retryLabel={t("retry")}
      homeLabel={t("home")}
      referenceLabel={t("reference")}
      digest={error.digest}
      onRetry={reset}
    />
  );
}

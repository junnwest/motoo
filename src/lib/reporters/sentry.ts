import * as Sentry from "@sentry/node";
import type { Reporter, ReportContext, Severity } from "@/lib/report";

/**
 * Sentry adapter for the `Reporter` interface (docs/PRELAUNCH.md #16).
 *
 * **Server-side only, deliberately.** The full `@sentry/nextjs` SDK also
 * instruments the browser, and two things make that a separate decision rather
 * than a bigger install:
 *
 *   - The CSP enforces `connect-src 'self'` (see `src/lib/csp.ts`), so a
 *     browser-side Sentry transport would be blocked outright. Enabling it means
 *     allowlisting Sentry's ingest host — a real widening of the policy, for a
 *     real benefit, but not one to do as a side effect of picking a backend.
 *   - It puts a third-party script on the page, which is what currently keeps
 *     the cookie-banner question (#10) unnecessary.
 *
 * Everything `reportError` is wired into today is server-side — the money path,
 * including the charged-but-not-credited case — so this covers what matters
 * now, and the client half stays an explicit choice.
 *
 * Initialisation is lazy and one-shot. If `SENTRY_DSN` is missing the adapter
 * reports itself unusable and `getReporter()` falls back to console rather than
 * silently dropping every error, which is the failure mode that would matter
 * most and show least.
 */
export class SentryReporter implements Reporter {
  private ready = false;

  constructor() {
    const dsn = process.env.SENTRY_DSN;
    if (!dsn) return;
    Sentry.init({
      dsn,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
      // Vercel exposes the deploy's commit SHA; without it every error is
      // attributed to "unknown" and "did this start after my last deploy"
      // becomes unanswerable, which is most of what you want this for.
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      // Errors only. Performance tracing samples every request and is a
      // different (and much larger) volume decision — off until someone asks
      // for it on purpose.
      tracesSampleRate: 0,
      // The app already decides what may leave the process: ReportContext.meta
      // is documented as ids-only, no PII. Letting the SDK attach request
      // bodies, headers and cookies on top of that would quietly undo it.
      sendDefaultPii: false,
    });
    this.ready = true;
  }

  usable(): boolean {
    return this.ready;
  }

  capture(error: unknown, context: ReportContext, severity: Severity) {
    const e = error instanceof Error ? error : new Error(String(error));
    Sentry.withScope((scope) => {
      scope.setLevel(severity === "warn" ? "warning" : "error");
      // The scope is the grouping key that makes a list of errors a worklist
      // rather than a feed — "donateMochi.creditFailed" is a thing to fix,
      // "Error" is not.
      scope.setTag("scope", context.scope);
      if (context.meta) scope.setContext("meta", context.meta);
      Sentry.captureException(e);
    });
  }
}

/**
 * Error reporting.
 *
 * Server actions swallow their failures into a generic `{ ok: false }` on
 * purpose — a user should not read a stack trace — but until now that was the
 * *only* thing that happened to them. A failing donation looked identical to a
 * declined one from the outside, and nothing anywhere recorded it
 * (docs/PRELAUNCH.md #16).
 *
 * Deliberately not a vendor SDK yet. The valuable half is calling something
 * consistent at every catch site; which backend receives it is a swap behind
 * `REPORT_PROVIDER`, the same shape as payments, verification and email. The
 * console adapter emits one line of JSON, which is what Vercel's log drain
 * wants anyway.
 *
 * **Never throws.** A reporter that can fail the request it is reporting on is
 * worse than no reporter.
 */

export type Severity = "error" | "warn";

export type ReportContext = {
  /** Where it happened — action or route name, e.g. "donateMochiAction". */
  scope: string;
  /** Anything that helps reproduce it. Must not carry secrets or PII beyond
   *  ids: this ends up in a log aggregator someone else can read. */
  meta?: Record<string, string | number | boolean | null>;
};

export interface Reporter {
  capture(
    error: unknown,
    context: ReportContext,
    severity: Severity,
  ): void | Promise<void>;
}

class ConsoleReporter implements Reporter {
  capture(error: unknown, context: ReportContext, severity: Severity) {
    const e = error instanceof Error ? error : new Error(String(error));
    // One line of JSON: greppable, and parsed as structured data by every log
    // platform including Vercel's. A multi-line dump is neither.
    console[severity === "warn" ? "warn" : "error"](
      JSON.stringify({
        level: severity,
        scope: context.scope,
        message: e.message,
        stack: e.stack?.split("\n").slice(0, 6).join(" | "),
        ...context.meta,
        at: new Date().toISOString(),
      }),
    );
  }
}

let reporter: Reporter | null = null;

function getReporter(): Reporter {
  if (reporter) return reporter;
  const kind = process.env.REPORT_PROVIDER ?? "console";
  switch (kind) {
    case "console":
      reporter = new ConsoleReporter();
      break;
    // case "sentry": reporter = new SentryReporter(); break;
    default:
      // Unlike the other providers, this one does NOT throw on an unknown
      // value. Refusing to start because the *error reporter* is misconfigured
      // would be the reporting equivalent of a smoke alarm burning the house
      // down; fall back and say so.
      console.warn(
        JSON.stringify({
          level: "warn",
          scope: "report",
          message: `Unknown REPORT_PROVIDER "${kind}"; falling back to console.`,
        }),
      );
      reporter = new ConsoleReporter();
  }
  return reporter;
}

/** Record a failure. Safe to call from anywhere, including a catch block whose
 *  own job is to return a friendly message. */
export function reportError(error: unknown, context: ReportContext): void {
  try {
    void getReporter().capture(error, context, "error");
  } catch {
    // A reporter that throws must not take the request with it.
  }
}

/** For failures that are handled and expected but still worth counting — a
 *  compensating void, a best-effort email that didn't send. */
export function reportWarning(error: unknown, context: ReportContext): void {
  try {
    void getReporter().capture(error, context, "warn");
  } catch {
    // as above
  }
}

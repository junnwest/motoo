"use client";

import Link from "next/link";
import { Mochi } from "@/components/Mochi";

/**
 * The shared body of every error boundary (`app/error.tsx`,
 * `app/studio/error.tsx`). One component so a route-level failure looks the
 * same wherever it happens, and so the recovery affordances can't drift apart.
 *
 * **Client-only, and deliberately chrome-free.** An `error.tsx` is a client
 * component that receives `{ error, reset }` and no children, so it can't
 * render `<Nav/>` (an async server component) — and shouldn't want to: when a
 * page has already thrown, the nav's own session/DB reads are exactly the kind
 * of thing that may be failing too. A self-contained card can't take the page
 * down a second time.
 *
 * `reset()` re-renders the segment in place, which is the right first move for
 * a transient failure (a DB blip, a cold connection). The home link is the
 * escape hatch when it isn't transient.
 *
 * Copy is passed in rather than read from next-intl here, so this stays usable
 * from any boundary regardless of which namespace its labels live in — the same
 * reason `ui/Modal` takes `closeLabel` as a prop.
 */
export function ErrorState({
  title,
  body,
  retryLabel,
  homeLabel,
  homeHref = "/",
  referenceLabel,
  digest,
  onRetry,
}: {
  title: string;
  body: string;
  retryLabel: string;
  homeLabel: string;
  homeHref?: string;
  referenceLabel: string;
  /** Next's error digest — the only handle on the server-side stack, which is
   *  never sent to the browser. Shown so a user can quote it in a report. */
  digest?: string;
  onRetry: () => void;
}) {
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] w-full max-w-[560px] flex-col items-center justify-center px-6 py-24 text-center">
      <div className="mb-5 flex items-end gap-2">
        <Mochi width={38} height={31} float />
        <Mochi width={50} height={41} float floatDelay={0.5} />
      </div>
      <h1 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink break-keep sm:text-[30px]">
        {title}
      </h1>
      <p className="mt-3 max-w-[420px] text-[15.5px] leading-[1.6] text-body break-keep">
        {body}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[14px] bg-coral px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_rgba(224,138,111,.34)] transition-transform duration-150 hover:brightness-[1.03] active:scale-[.98]"
        >
          {retryLabel}
        </button>
        <Link
          href={homeHref}
          className="rounded-[14px] border-[1.5px] border-line-3 bg-white px-6 py-3 text-[15px] font-bold text-ink transition-colors hover:border-coral/60"
        >
          {homeLabel}
        </Link>
      </div>

      {digest && (
        <p className="mt-8 font-mono text-[11px] tracking-[0.04em] text-muted">
          {referenceLabel} · {digest}
        </p>
      )}
    </main>
  );
}

import { PrismaClient } from "@prisma/client";

/**
 * Query visibility (docs/PRELAUNCH.md #35).
 *
 * The count lived in a doc — "/home issues 7, /s/[handle] ~19" — which meant it
 * was only right on the day someone counted, and every feature since has added
 * reads (hidden creators, the donation ledger, disputes, settlement) with
 * nothing to say so.
 *
 * `DEBUG_QUERIES=1` logs one line per Prisma call. To count a page: start the
 * dev server with it set, load exactly one page, count the lines.
 *
 * A per-request *total* was tried twice and both attempts were wrong, which is
 * why this is a log rather than a number:
 *
 *   - A `$on("query")` listener reports zero, because Prisma's event callbacks
 *     run in the engine's own async context, outside any AsyncLocalStorage the
 *     request set up.
 *   - Wrapping the page function in an ALS scope also reports zero, and this is
 *     the interesting one: an async page returns its JSX as soon as its own
 *     awaits finish, and almost every query in this app happens afterwards,
 *     while React renders the child server components (ConsumerShell, Sidebar,
 *     RightRail, HomeSignedIn). The scope closes before the work happens. A
 *     number that counted only the page body's own queries would have been
 *     worse than no number, because it would have looked authoritative.
 *
 * It logs the model and operation, not arguments — those carry emails, handles
 * and note text, and a debug flag should not be a way to spill user data into a
 * terminal.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof makeClient> | undefined;
};

const logQueries = process.env.DEBUG_QUERIES === "1";

function makeClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
  if (!logQueries) return client.$extends({});
  return client.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        console.log(`[q] ${model ?? "raw"}.${operation}`);
        return query(args);
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Split out of `search.ts` so client components (the nav's `SearchBox`) can
 * import this constant without pulling in `search.ts`'s own top-level
 * `import { prisma } from "@/lib/db"` — Next refuses to bundle that for the
 * browser, and it fails at runtime rather than at build time.
 */
export const SEARCH_LIMIT = 12;
/** The nav's live dropdown — a preview, not the results page, so far fewer. */
export const SUGGEST_LIMIT = 4;
/** Below this a query matches most of the catalogue; treated as no query. */
export const MIN_QUERY_LENGTH = 2;

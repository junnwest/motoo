import { NextResponse } from "next/server";
import { globalSearch, SUGGEST_LIMIT, MIN_QUERY_LENGTH } from "@/lib/search";
import { getCurrentBacker } from "@/lib/session";

/**
 * Backs the nav search box's live dropdown (`SearchBox`) — the same
 * `globalSearch` the `/search` results page uses, just capped to
 * `SUGGEST_LIMIT` and without the updates group, which is preview-sized
 * elsewhere. GET + `?q=` rather than a server action: the client debounces
 * and fires this on every qualifying keystroke, which a server action isn't
 * built for (each call would be a distinct form-less invocation with no
 * built-in cancellation).
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q") ?? "";

  if (q.trim().length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ creators: [], items: [], empty: true });
  }

  const viewer = await getCurrentBacker();
  const { creators, items, empty } = await globalSearch(
    q,
    viewer?.id,
    SUGGEST_LIMIT,
  );

  return NextResponse.json({ creators, items, empty });
}

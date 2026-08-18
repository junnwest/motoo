import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CreatorCover } from "@/components/CreatorCover";
import { getFollowList } from "@/lib/follows";

/**
 * The following list, for screens the Sidebar never reaches
 * (docs/PRELAUNCH.md #26).
 *
 * The Sidebar is `lg:block`, so below that breakpoint the list of creators
 * someone follows simply did not exist — the one part of the app that is
 * *theirs*, and on a phone there was no route to it at all. The mobile tab bar
 * has four slots and no room for a fifth.
 *
 * A horizontal strip rather than the sidebar's vertical list: at the top of
 * /home it has to cost a couple of rows, not a screenful, and a row of avatars
 * is the shape every phone app uses for exactly this.
 *
 * `lg:hidden` — above that the Sidebar is showing the same list, and two copies
 * of it on one screen would read as a bug.
 */
export async function FollowingStrip({ backerId }: { backerId: string }) {
  const [follows, t] = await Promise.all([
    // Cached per request, and the Sidebar calls it too — on desktop this
    // renders nothing but still shares that one query rather than adding one.
    getFollowList(backerId),
    getTranslations("sidebar"),
  ]);

  if (follows.length === 0) return null;

  return (
    <div className="lg:hidden">
      <h2 className="text-sm font-bold text-ink">{t("followingTitle")}</h2>
      <ul className="-mx-1 mt-2 flex gap-3 overflow-x-auto px-1 pb-1">
        {follows.map((f) => (
          <li key={f.streamerId} className="flex-none">
            <Link
              href={`/s/${f.handle}`}
              className="flex w-[64px] flex-col items-center gap-1.5"
            >
              <CreatorCover
                handle={f.handle}
                displayName={f.displayName}
                className="h-12 w-12 rounded-full"
                markClass="text-base"
              />
              <span className="w-full truncate text-center text-2xs text-body">
                {f.displayName}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

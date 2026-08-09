"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleFollow } from "@/lib/follow-actions";

/**
 * Free follow toggle on a creator profile — distinct from the 모찌 보내기 CTA,
 * which costs money. Optimistic: flips immediately, reconciles against the
 * server response, and reverts on failure (e.g. a signed-out visitor).
 */
export function FollowButton({
  streamerId,
  handle,
  initialFollowing,
  signedIn,
  compact = false,
}: {
  streamerId: string;
  handle: string;
  initialFollowing: boolean;
  signedIn: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("profile");
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  // Adjust state during render when the prop changes, not via useEffect —
  // React's documented pattern for this (an effect would cost an extra,
  // avoidable render). Needed because useState's initial value only applies
  // on mount: a router.refresh() after the DonateMochi follow-nudge toggles the
  // same creator wouldn't otherwise reach this already-mounted instance.
  const [prevInitialFollowing, setPrevInitialFollowing] =
    useState(initialFollowing);
  if (initialFollowing !== prevInitialFollowing) {
    setPrevInitialFollowing(initialFollowing);
    setFollowing(initialFollowing);
  }

  if (!signedIn) return null; // signup happens via the buy-mochi CTA, not here

  function onClick() {
    const next = !following;
    setFollowing(next); // optimistic
    startTransition(async () => {
      const result = await toggleFollow(streamerId, handle);
      if (!result.ok) {
        setFollowing(!next); // revert
        return;
      }
      setFollowing(result.following);
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={following}
      className={
        compact
          ? // Compact lives in the right rail, four at a time in a 2x2 grid.
            // Solid ink there put four black slabs beside the brand's coral and
            // read as the loudest thing on a discovery panel, which is the one
            // place nothing should shout. Tinted coral offers the action without
            // out-weighing the page.
            `w-full rounded-sm border px-2 py-1.5 text-2xs font-bold transition-colors duration-swift disabled:opacity-60 ${
              following
                ? "border-line-3 bg-white text-muted-2 hover:border-coral/50 hover:text-ink"
                : "border-coral-soft bg-coral-chip text-coral-deep hover:border-coral hover:bg-coral hover:text-white"
            }`
          : `rounded-md border px-4 py-3 text-base font-bold transition-colors disabled:opacity-60 ${
              following
                ? "border-line-3 bg-white text-ink hover:border-coral/50"
                : "border-ink bg-ink text-cream hover:bg-ink/90"
            }`
      }
    >
      {following ? t("following") : t("follow")}
    </button>
  );
}

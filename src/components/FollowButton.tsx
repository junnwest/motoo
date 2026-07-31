"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleFollow } from "@/lib/follows";

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
  // on mount: a router.refresh() after the BuyMochi follow-nudge toggles the
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
          ? `w-full rounded-[8px] border px-2 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-60 ${
              following
                ? "border-line-3 bg-white text-ink hover:border-coral/50"
                : "border-ink bg-ink text-cream hover:bg-ink/90"
            }`
          : `rounded-[12px] border px-4 py-3 text-[14.5px] font-bold transition-colors disabled:opacity-60 ${
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

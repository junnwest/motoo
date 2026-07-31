import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, callback: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(callback);
  return () => set!.delete(callback);
}

function emit(key: string) {
  listeners.get(key)?.forEach((cb) => cb());
}

function getSnapshot(key: string) {
  return localStorage.getItem(key) === "1";
}

/**
 * Persisted collapse toggle for the app shell's rails (Sidebar/RightRail).
 * `useSyncExternalStore` instead of a mount effect that calls `setState` —
 * reading `localStorage` in an effect body and setting state synchronously
 * trips `react-hooks/set-state-in-effect`, and is genuinely the pattern that
 * rule exists to steer away from (see FollowButton for the same lesson
 * applied to prop-driven state). The server snapshot is always `false`
 * (expanded), so SSR and the first client paint agree — the real preference
 * applies once React reconciles against the client snapshot.
 */
export function usePersistedCollapse(
  key: string,
): [boolean, (next: boolean) => void] {
  const collapsed = useSyncExternalStore(
    (callback) => subscribe(key, callback),
    () => getSnapshot(key),
    () => false,
  );

  const setCollapsed = useCallback(
    (next: boolean) => {
      localStorage.setItem(key, next ? "1" : "0");
      emit(key);
    },
    [key],
  );

  return [collapsed, setCollapsed];
}

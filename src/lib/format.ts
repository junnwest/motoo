/** Formatting helpers. Money is integer KRW everywhere. */

export function formatKrw(krw: number): string {
  return `₩${krw.toLocaleString("ko-KR")}`;
}

/** Compact KRW for stat tiles: ₩6.4k, ₩1.2M. */
export function formatKrwCompact(krw: number): string {
  if (krw >= 1_000_000) return `₩${(krw / 1_000_000).toFixed(1)}M`;
  if (krw >= 1_000) return `₩${(krw / 1_000).toFixed(1)}k`;
  return `₩${krw}`;
}

/** Mochi count with the currency's compact form (3.1k). */
export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

export function formatPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Founding number as shown to fans: #001, #312. */
export function formatFoundingNumber(n: number): string {
  return `#${String(n).padStart(3, "0")}`;
}

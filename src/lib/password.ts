import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// The policy itself lives in ./passwordPolicy so client components can import
// it without pulling node:crypto (above) into the browser bundle. Re-exported
// here so the server-side importers that already reach for it are unchanged.
export { PASSWORD_RE } from "./passwordPolicy";

/**
 * Password hashing for the credentials login path (email+password, live in
 * both dev and production — OAuth users have no password to hash).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  return hashBuf.length === test.length && timingSafeEqual(hashBuf, test);
}

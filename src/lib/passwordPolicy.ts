/**
 * The password rule, split out from `password.ts` so a **client** component can
 * import it.
 *
 * `password.ts` imports `node:crypto` at module scope for hashing. That is fine
 * for the server actions that use it, but pulling it into a client bundle blows
 * up at runtime — which is exactly what the reset form did on its first
 * submit. The policy is a regex; it has no business dragging scrypt across the
 * network with it.
 */

/** 8+ characters, at least one letter and one number. */
export const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

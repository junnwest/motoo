/**
 * OAuth token exchange for the "link a provider from /settings" flow —
 * deliberately independent of Auth.js's own `signIn()`/`/api/auth/*`
 * machinery. See the note in `/api/settings/link/[provider]/route.ts` for
 * why linking doesn't reuse the primary sign-in path.
 *
 * Endpoints below are taken directly from the installed
 * `@auth/core/providers/{google,kakao,naver}` source, so they match exactly
 * what `src/auth.ts`'s own provider configs already talk to. Kakao and Naver
 * aren't OIDC-discoverable — their Auth.js providers are already hand-rolled
 * to these same URLs — so nothing is being skipped by not using a discovery
 * document; only Google is genuinely OIDC, and its endpoints are Google's
 * long-stable canonical ones.
 *
 * Uses PKCE (S256) on top of `state`, matching how Auth.js already talks to
 * these same three providers on the ordinary login path. RFC 9700 (the IETF's
 * 2025 OAuth Security BCP) recommends PKCE for every client type, not only
 * public ones without a client secret — this flow has one, but there is no
 * reason to be the one OAuth exchange in the app that skips it.
 */

import { randomBytes, createHash } from "node:crypto";

export type LinkableProvider = "google" | "kakao" | "naver";

/** Each provider's userinfo response shape, narrowed just to the fields extractProfile reads. */
interface GoogleProfile {
  sub: string;
  email?: string;
}
interface KakaoProfile {
  id: number | string;
  kakao_account?: { email?: string };
}
interface NaverProfile {
  response: { id: string; email?: string };
}

interface ProviderConfig {
  authorizationUrl: string;
  tokenUrl: string;
  userinfoUrl: string;
  /** "" for kakao/naver — their consent is entirely console-configured, not scope-driven. */
  scope: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  extractProfile: (json: unknown) => { providerAccountId: string; email: string | null };
}

export const PROVIDER_CONFIG: Record<LinkableProvider, ProviderConfig> = {
  google: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userinfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    scope: "openid email profile",
    clientIdEnv: "AUTH_GOOGLE_ID",
    clientSecretEnv: "AUTH_GOOGLE_SECRET",
    extractProfile: (json) => {
      const p = json as GoogleProfile;
      return { providerAccountId: p.sub, email: p.email ?? null };
    },
  },
  kakao: {
    authorizationUrl: "https://kauth.kakao.com/oauth/authorize",
    tokenUrl: "https://kauth.kakao.com/oauth/token",
    userinfoUrl: "https://kapi.kakao.com/v2/user/me",
    scope: "",
    clientIdEnv: "AUTH_KAKAO_ID",
    clientSecretEnv: "AUTH_KAKAO_SECRET",
    extractProfile: (json) => {
      const p = json as KakaoProfile;
      return { providerAccountId: String(p.id), email: p.kakao_account?.email ?? null };
    },
  },
  naver: {
    authorizationUrl: "https://nid.naver.com/oauth2.0/authorize",
    tokenUrl: "https://nid.naver.com/oauth2.0/token",
    userinfoUrl: "https://openapi.naver.com/v1/nid/me",
    scope: "",
    clientIdEnv: "AUTH_NAVER_ID",
    clientSecretEnv: "AUTH_NAVER_SECRET",
    extractProfile: (json) => {
      const p = json as NaverProfile;
      return { providerAccountId: p.response.id, email: p.response.email ?? null };
    },
  },
};

function clientId(provider: LinkableProvider): string {
  const id = process.env[PROVIDER_CONFIG[provider].clientIdEnv];
  if (!id) throw new Error(`${PROVIDER_CONFIG[provider].clientIdEnv} is not set`);
  return id;
}

function clientSecret(provider: LinkableProvider): string {
  const secret = process.env[PROVIDER_CONFIG[provider].clientSecretEnv];
  if (!secret) throw new Error(`${PROVIDER_CONFIG[provider].clientSecretEnv} is not set`);
  return secret;
}

/** RFC 7636 §4.1: 43-128 chars of unreserved URL characters. 32 random bytes, base64url-encoded, is 43. */
export function generateCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function codeChallengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizationUrl(
  provider: LinkableProvider,
  state: string,
  redirectUri: string,
  codeVerifier: string,
): string {
  const cfg = PROVIDER_CONFIG[provider];
  const params = new URLSearchParams({
    client_id: clientId(provider),
    redirect_uri: redirectUri,
    response_type: "code",
    state,
    code_challenge: codeChallengeFromVerifier(codeVerifier),
    code_challenge_method: "S256",
  });
  if (cfg.scope) params.set("scope", cfg.scope);
  return `${cfg.authorizationUrl}?${params.toString()}`;
}

/** Throws on a non-2xx response — the callback route is responsible for catching it. */
export async function exchangeCodeForToken(
  provider: LinkableProvider,
  code: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<{ access_token: string }> {
  const cfg = PROVIDER_CONFIG[provider];
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId(provider),
      client_secret: clientSecret(provider),
      redirect_uri: redirectUri,
      code,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    throw new Error(`${provider} token exchange failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export async function fetchProviderProfile(
  provider: LinkableProvider,
  accessToken: string,
): Promise<{ providerAccountId: string; email: string | null }> {
  const cfg = PROVIDER_CONFIG[provider];
  const res = await fetch(cfg.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`${provider} userinfo fetch failed: ${res.status} ${await res.text()}`);
  }
  const json = await res.json();
  return cfg.extractProfile(json);
}

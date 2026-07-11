/**
 * Which OAuth providers are actually configured (credentials present in env).
 * Mirrors the conditional provider setup in src/auth.ts so the signup/login UI
 * can render social buttons that light up only when they'll really work. When a
 * provider is off, its button gracefully shows a "coming soon" note instead of
 * kicking off a broken OAuth redirect.
 */
export type OAuthProvider = "kakao" | "naver" | "google";

export interface EnabledProviders {
  kakao: boolean;
  naver: boolean;
  google: boolean;
}

export function getEnabledOAuthProviders(): EnabledProviders {
  return {
    kakao: !!(process.env.AUTH_KAKAO_ID && process.env.AUTH_KAKAO_SECRET),
    naver: !!(process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET),
    google: !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  };
}

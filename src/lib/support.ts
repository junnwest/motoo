/**
 * The one place the customer-support channel is defined.
 *
 * `/refund` instructs users to contact 고객센터, and 전자상거래법 expects a
 * published contact for a 통신판매중개업자 — so this address is a compliance
 * surface, not decoration. It lives here rather than in `messages/` because it
 * is a fact about the business, not copy: the footer link, the refund page, and
 * anything else that needs it must never be able to disagree about what it is.
 *
 * If this is ever set back to `null`, every consumer degrades to "no channel
 * shown" rather than rendering a link that goes nowhere — a dead `href="#"`
 * labelled 고객센터 is worse than no link, because it looks live.
 *
 * Swap this for the business address once 사업자등록 lands; nothing else needs
 * to change.
 */
export const SUPPORT_EMAIL: string | null = "junn223@gmail.com";

/** `mailto:` href for the support address, or null when none is configured. */
export function supportMailto(): string | null {
  return SUPPORT_EMAIL ? `mailto:${SUPPORT_EMAIL}` : null;
}

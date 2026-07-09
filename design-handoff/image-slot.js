# Handoff: Motoo Landing Pages (Creator + Fan)

## Overview
Motoo is a web platform for the Korean streaming market. Fans send **mochi (모찌)** — a
gamified *support* currency — to creators. Mochi is **support, not an investment**: no payout,
resale, or financial return. Money flows directly to the creator through a licensed payment
gateway (PG); the platform never holds funds. The flagship product is the **Trust Report**, a
monthly credibility report creators show to brands, sponsors, and MCNs.

This bundle covers the **two public landing pages**, which are intentionally separate:
- **Creator landing** (`motoo for creators`) — confident/editorial, conversion goal = "apply as creator".
- **Fan (supporter) landing** (`motoo for fans`) — warm/discovery, conversion goal = "explore creators / sign up".

Both live in a single file as two side-by-side frames on a design canvas.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended
look and behavior, **not** production code to copy directly. The `.dc.html` files use a bespoke
in-house preview runtime (a `<x-dc>` wrapper + `support.js`); **ignore that wrapper**. Only the
markup and inline styles inside are meaningful as a spec.

Your task: **recreate these designs in the target codebase's existing environment** (React, Vue,
Svelte, etc.) using its established components, tokens, and patterns. If no frontend exists yet,
pick the most appropriate framework and implement there. Do **not** ship the HTML directly, and do
not depend on the preview runtime.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, layout, and interactions are
intended as shown. Recreate pixel-faithfully, but swap in the codebase's real component library
where equivalents exist (buttons, inputs, cards). Desktop is the primary target; mobile was not
designed for these two pages yet (see Responsive).

## Global System

**Fonts**
- Body / UI / headings: **Pretendard** (Korean sans). CDN used in mock:
  `https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css`
  Use the codebase's Pretendard package if available.
- Labels / eyebrows / mono numerals: **IBM Plex Mono** (weights 400/500/600).
- Headings: weight 800, `letter-spacing: -0.03em` (hero `-0.035em`). Body: 400–500.

**Color tokens**
| Token | Hex | Use |
|---|---|---|
| Mochi Coral | `#E08A6F` | primary buttons, accents, mark body |
| Coral (text/deep) | `#C9694C` | eyebrow labels, inline emphasis on cream |
| Coral gradient | `linear-gradient(158deg,#F3B49B,#E2855F)` | mark body, glossy fills |
| Ink | `#211C18` | primary text, dark sections, footer |
| Ink (2) | `#2C2620` | cards on ink background |
| Cream (page) | `#FBF6EF` | page background |
| Cream warm | `#F6E8DC` | alternating section background, fan hero |
| Cream strip | `#F6ECDF` | logo/proof strip |
| Panel Cream | `#FCEFE4` | radial center of token backdrops |
| Mochi inner | `#FFFDF8` → `#F3E1CF` | mochi cross-section (radial) |
| Sage (trust) | `#7E9B82` | "trust/ready" positive accent, STRONG chip |
| Sage pale | `#EAF0EA` / border `#CFE0D2` | readiness chip background |
| Border | `#ECE1D2` (outer), `#EEE3D5` (card), `#E4D8C8` (input) | hairlines |
| Muted text | `#74695F` (body), `#9b8d7c` (meta), `#7d7164` (footer meta) | secondary copy |
| Live red | `#E0584C` | LIVE badge on fan cards |

**Spacing / radii / shadow**
- Section padding: desktop `~72–96px` vertical, `56px` horizontal.
- Card radius: `16–24px`; buttons `12–14px`; pills/chips `999px`; app-icon tile `26px`.
- Card border: `1px solid #EEE3D5` on cream/white.
- Primary button shadow: `0 8–10px 18–24px rgba(224,138,111,0.30–0.34)`.
- Card float shadow: `0 30px 80px rgba(33,28,24,0.14)` (page frame), `0 28–34px 60–70px rgba(33,28,24,0.16–0.18)` (hero cards).
- Eyebrow label pattern: IBM Plex Mono, `13px`, `letter-spacing:.2em`, `text-transform:uppercase`, color `#C9694C` (or `#E9A488` on ink).

## The Brand Mark & Mochi Asset (critical)
The **logo mark** and the **in-product mochi token** share one form: a soft, slightly tilted
mochi (squircle) with a **cross-section oval at center-bottom** (the "cut mochi", no face).
- Body: `linear-gradient(158deg,#F3B49B,#E2855F)`, radius `47% 47% 49% 49% / 57% 57% 43% 43%`,
  `box-shadow: inset 0 4px 6px rgba(255,255,255,.5), inset 0 -5px 9px rgba(168,90,64,.32)`.
- Cross-section: a light radial oval at **center-bottom** (`50% 80%`, ~`52%×44%`,
  `#FFFDF8`→`#F5E4D2`). In the mock it is painted as a **layered background gradient** on the same
  element (so it survives DOM-capture); implement as either a background layer or an inner element.
- **Logo** = mark tilted `-4°` + wordmark `motoo` (Pretendard 800, `letter-spacing:-.055em`).
- **Token** (currency) = same mark, **0° tilt** inside chips/buttons, **always next to a number or
  context** (e.g. "3.1k 모찌", "모찌 보내기"). Never as a standalone brand mark.
- Single-tone/mono version: paint the cross-section in the background color (negative space) so it
  reads at favicon size / 1-color print.
- Full spec (lockups, app icons, mono, sizes, DO/DON'T) is in `Motoo Brand Kit.dc.html`.

## Cross-cutting copy rules (enforce in all strings)
- **Never** use investment / return / ROI / profit / resale / "buy low" language.
- Mochi = **support + status** only. No balance, valuation, or portfolio framing anywhere.
- Always keep the plain disclosure available: "모찌는 응원이며 투자가 아닙니다 — 환급·재판매·수익 없음.
  결제는 크리에이터(판매자)에게 직접, 플랫폼은 자금을 보유하지 않습니다."
- UI copy is **Korean** (target market). Keep the exact Korean strings from the mock.

---

## Screen 1 — Creator Landing (`motoo for creators`)

**Purpose:** Convert mid/small Korean creators to apply. Hero pitch = "turn your fans' support
into proof you can show sponsors."

**Frame width in mock:** 1440px content column. Vertical section stack, full-bleed background bands.

Section order (top → bottom):
1. **Nav** (sticky-style bar, cream, `1px` bottom border). Left: mark + `motoo`. Right links:
   `기능 · 트러스트 리포트 · 수수료 · 후원자용 ↗ (muted) · 로그인 (ink) · [크리에이터 신청]` (coral pill button).
2. **Hero** (2-col grid `1.05fr / .95fr`, radial coral glow top-right).
   - Eyebrow `MOTOO FOR CREATORS`. H1 `62px/1.1/800`: "팬의 응원을, / 스폰서에게 보여줄 / **증거**로."
     — "증거" in coral `#C9694C` with a `5px` `#F2B5A0` bottom border.
   - Sub `19px/1.62 #74695F`, max-width 480px.
   - Buttons: primary coral "크리에이터로 신청하기 →", secondary white/`1.5px #E4D8C8` "샘플 리포트 보기".
   - Trust line (IBM Plex Mono, muted): sage dot + "라이선스 PG 직접 결제 · 플랫폼은 자금을 보유하지 않음".
   - **Visual:** a floating Trust Report card (white, radius 24px, rotate `-2deg`) with avatar
     (image slot), `@크리에이터A`, `TRUST REPORT · 2026.06`, `STRONG` sage chip; a 3-up stat row
     (312 총 백커 / 41% 재후원율 / 94% 퍼크 이행); an area sparkline (coral, `+18%`). Plus two
     floating pills: ink "+312 응원" (with token), sage "✓ 스폰서 준비 완료" — both gently float
     (`@keyframes floaty` translateY ±9px, 5–6s ease-in-out infinite).
3. **Logo / proof strip** (`#F6ECDF`, top+bottom border). Label "함께하는 크리에이터" + 5 faux
   partner wordmarks at `opacity:.55`.
4. **Insight band** (ink `#211C18`). Eyebrow "왜 motoo 인가". 2-col: H2 `44px` "스폰서는 조회수보다 /
   **진짜 팬덤**을 봅니다." (진짜 팬덤 in `#E9A488`) + paragraph. Then 3 cards (`#2C2620`,
   border `#3a322a`, radius 18): "숫자는 많지만 / 후원은 흩어져 있고 / 스폰서는 검증을 원합니다".
5. **How it works** (cream). Centered eyebrow + H2 "응원이 증거가 되기까지, 세 단계". 3 cards
   (white, radius 22): 01 팬이 모찌로 응원해요 (two tokens) / 02 핵심 팬에게 보상해요 (🏅 tile) /
   03 트러스트 리포트로 증명해요 (📄 tile). Card mono step number in coral.
6. **Trust Report showcase** (`#F6E8DC`). 2-col `.85fr / 1.15fr`. Left: eyebrow "THE TRUST REPORT",
   H2 "한 장으로 끝내는 / 신뢰 증명", paragraph, 3 sage-check bullets, ink button "샘플 리포트 전체 보기 →".
   Right: **browser-framed report** (window chrome with 3 dots + `motoo.gg/r/creatorA · 공유용`),
   header (avatar, `@크리에이터A`, `TRUST REPORT · 2026년 6월`, `SPONSOR READINESS` + `STRONG`
   sage pill), a 3-segment readiness bar (middle = coral), and a 2×2 panel grid:
   `FAN SUPPORT 312` + mini bar chart, `FAN LOYALTY 41%` + donut, `EXECUTION 94%` + sage progress,
   `GROWTH +18%` + coral line. All panels: `#FBF6EF` bg, `1px #EEE3D5`, radius 14, mono micro-labels.
7. **Mochi explainer** (cream). White card, radius 24: two mochi shapes + H3 "모찌는 **응원**입니다 —
   투자가 아닙니다." + paragraph (no refund/resale/profit).
8. **Creator features** (cream). H2 "크리에이터를 위한 모든 도구". 5-col cards (radius 18): 팬 CRM 👥 /
   퍼크 트래커 ✅ / 정산·출금 💸 / 분석 📈 / 공유용 리포트 🔗 (alternating coral/sage icon tiles).
9. **Testimonial** (ink). Large `46px/1.34/700` quote (creator quote about landing first brand deal
   via Trust Report) + avatar + `@크리에이터A · 버추얼 · 평균 시청자 120명`.
10. **Safety strip** (cream, bottom border). 3 items: `19` 연령 확인·성인 인증 / ↩ 환불·청약철회 정책 /
    🔒 라이선스 PG 직접 결제·자금 미보유.
11. **Final CTA** (coral `#E08A6F`, white text, decorative circles). H2 `50px` "지금, 당신의 팬덤을
    증명하세요." + sub + ink button "크리에이터로 신청하기 →" + translucent-outline button "후원자이신가요? ↗".
12. **Footer** (ink). Mark + tagline + 3 link columns (제품 / 회사 / 약관, 약관 includes underlined
    환불·청약철회) + mono legal line: "(주)모투 · 통신판매중개업자 · 결제는 각 크리에이터(판매자)와 직접
    이루어지며 플랫폼은 자금을 보유하지 않습니다."

## Screen 2 — Fan / Supporter Landing (`motoo for fans`)

**Purpose:** Warm, discovery-led. Convert fans to explore creators & sign up.

Section order:
1. **Nav** — same shell. Right links: `둘러보기 · 모찌란? · 크리에이터용 ↗ (muted) · 로그인 · [회원가입]` (coral pill).
2. **Hero** (centered, `#F6E8DC` bg, 3 floating decorative mochi via `floaty`).
   Eyebrow `MOTOO FOR FANS`. H1 `60px/1.12/800`: "좋아하는 크리에이터를, / **모찌**로 응원하세요."
   Sub, then a **search bar** (white input `🔍 크리에이터·카테고리 검색` + coral "검색" button, max-width 560),
   then category pills: 전체(ink active) · 게임 · 일상 · 음악 · 버추얼 · 공부.
3. **Trending creators** (cream). Header "지금 뜨는 크리에이터" + "전체 둘러보기 →". 4-col cards
   (radius 20): each = thumbnail image-slot (150px) with optional LIVE badge (red pill), avatar
   image-slot + `@크리에이터X` + category·viewers, and a coral-tinted "응원하기" chip (token + label).
4. **How mochi works** (ink). Eyebrow "HOW MOCHI WORKS", H2 "모찌로 응원하는 법", 3 cards (`#2C2620`):
   01 크리에이터 찾기 / 02 모찌 보내기 (결제는 크리에이터에게 직접) / 03 혜택·배지 받기.
5. **Benefits** (cream). H2 "응원하면 이런 게 좋아요". 2×2 cards (radius 20, icon tile + title + copy):
   💌 마음을 전해요 / 🎁 단골 혜택을 받아요 / 🏅 파운딩 배지로 인정받아요 / 📒 내 응원을 한눈에.
6. **Spotlight creator** (cream). Split card (radius 24): left full-bleed image-slot; right =
   eyebrow "이주의 크리에이터", `@크리에이터C`, description, 3 stats (312 백커 / 3.1k 받은 모찌 /
   STRONG 신뢰도 in sage), coral "모찌 보내기" button (token).
7. **Mochi explainer (warm)** (cream). `#F6E8DC` card, 3 mochi, H3 "모찌는 **응원**이에요 — 투자가
   아니에요." + paragraph ("잔액이나 가치로 표시되지 않아요").
8. **Safety strip** — same 3 items as creator page (top+bottom border).
9. **Final CTA** (coral, decorative mochi shapes). H2 `48px` "오늘, 첫 응원을 보내보세요." + ink
   button "크리에이터 둘러보기 →" + outline "회원가입".
10. **Footer** (ink). Mark + tagline "좋아하는 크리에이터를 응원하는 가장 따뜻한 방법." + 3 columns
    (둘러보기 / 지원 / 약관) + mono legal line.

## Interactions & Behavior
- **Nav CTAs**: creator page primary → creator application/onboarding; fan page primary → signup.
  "후원자용 ↗ / 크리에이터용 ↗" links cross-navigate between the two landing pages.
- **Search (fan hero)**: submits to the Explore/Discovery directory (filters: avg viewers, has
  Discord, accepting mochi, category). Category pills pre-filter.
- **Creator cards ("응원하기") / Spotlight ("모찌 보내기")**: go to creator profile → mochi checkout.
- **Floating elements**: `@keyframes floaty { 0%,100%{translateY(0)} 50%{translateY(-9px)} }`,
  5–7s, ease-in-out, infinite, staggered delays. Respect `prefers-reduced-motion` (disable).
- **Hover states** (not fully drawn — apply codebase convention): buttons darken ~6–8% / lift 1px;
  cards raise shadow slightly; links coral on hover. Define default `a` / `a:hover` colors from the
  palette (coral) so links never fall back to browser blue.
- **LIVE badge**: static red pill in mock; wire to real live status if available.

## State Management
Landing pages are mostly static/presentational. Dynamic bits to wire:
- Trending creators list + LIVE status (fetch).
- Spotlight creator (editorial pick / fetch).
- Search query + category filter → route to Explore with params.
- Auth state → swap 로그인/회원가입 for account menu when signed in.
- Trust Report showcase numbers are illustrative; can be static marketing values or a real sample.

## Design Tokens
See the Color/spacing tables above. Summary:
- Colors: `#E08A6F #C9694C #211C18 #2C2620 #FBF6EF #F6E8DC #F6ECDF #FCEFE4 #FFFDF8 #7E9B82 #EAF0EA #ECE1D2 #EEE3D5 #E4D8C8 #74695F #9b8d7c #7d7164 #E0584C`.
- Radius: 12/14 (buttons), 16–24 (cards), 999 (pills), 26 (app tile).
- Type: Pretendard 800 headings (`-0.03em`), 400–500 body; IBM Plex Mono 400–600 for labels/numerals.
- Shadows: primary-button coral glow; card float `rgba(33,28,24,.08–.18)`.

## Assets
- **Fonts**: Pretendard, IBM Plex Mono (both available via CDN / npm).
- **Brand mark & mochi token**: pure CSS in the mock (gradients + radius); see Brand Mark section
  and `Motoo Brand Kit.dc.html`. Recreate as an SVG component in production for crispness.
- **Photos**: hero avatars, creator thumbnails, and the spotlight image are **`<image-slot>`
  placeholders** (drag-drop in the mock) — replace with real `<img>`/CDN assets. IDs used:
  `cl_hero_avatar, cl_report_avatar, cl_quote_avatar` (creator);
  `ul_trend_1..4, ul_trend_a1..a4, ul_spotlight` (fan).
- **Icons**: emoji used as placeholders (👥 ✅ 💸 📈 🔗 💌 🎁 🏅 📒 📄). Replace with the codebase's
  icon set.

## Files (in this bundle)
- `Motoo Landing (hi-fi).dc.html` — the two landing pages (creator = left frame, fan = right frame).
- `Motoo Brand Kit.dc.html` — logo/mark + mochi-token spec (lockups, app icons, mono, sizes, palette, DO/DON'T).
- `image-slot.js` — the placeholder component used for photos in the mock (reference only; not needed in production).

> Reading tip: open the `.dc.html` files in a browser to view; when reading source, ignore the
> `<x-dc>`/`<helmet>`/`support.js` scaffolding and read the inline-styled markup as the spec.

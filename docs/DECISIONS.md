# motoo — Decision Log

Why the project is the way it is. Newest first. Keep entries short: decision,
rationale, and any constraint it creates.

## 2026-07-29 — The home's left rail is a *content* rail, and the fix was mostly data
`/home` got a sticky left rail (응원 중인 크리에이터: total balance + per-creator balances) and
widened 1100 → 1440.
- **Why not a nav sidebar**: the entire fan-side destination list is 홈 · 둘러보기 · 내 모찌 ·
  크리에이터 되기. Four links don't justify persistent 276px chrome — it would read as padding.
  "Who I support" is real data that grows with the user (the Twitch followed-channels
  pattern), so the rail carries content and the nav stays in the avatar dropdown.
- **The real cause of "too simple" was data, not layout**: the demo fan held mochi in *one*
  creator and had *one* order, while creators had 3–5 items and updates each. No layout
  rescues one card in a three-column grid. The seed now gives the demo fan **4 holdings + a
  second in-flight order**, so the home renders what a real user's looks like.
- **New section, 지금 이용할 수 있는 아이템**: items affordable *right now* with the balance
  already held for that creator, interleaved across creators so one cheap creator can't
  crowd out the rest (`getAffordableItems`). This is the missing half of the loop — the app
  showed a balance but never what it buys. Purely a read; `redeemItem` still enforces
  balance and stock in its transaction, so a stale card can't oversell.
- **Seeded creator posts are now varied** (6 templates, staggered dates). Every creator had
  the identical "이번 달 목표 달성 감사합니다!", and the home aggregates them side by side —
  four identical cards read as placeholder text.
- **Known tension**: the zero-holdings home has no rail and a narrower column, so the layout
  changes shape after a user's first purchase. Alternative (not taken): always render the
  rail with an empty state inside it, keeping the shell stable.

## 2026-07-29 — The app home is `/home`; `/` stays the marketing landing
Signed-in users are still redirected off `/`, but now to a real app **home** at `/home`
(`src/app/home/page.tsx` → `HomeSignedIn`) instead of to `/explore`. **Refines the
2026-07-11 "role-aware home"** rule: the redirect stays, the destination changes.
- **Rationale**: `/explore` is a browse *task* — verb-titled (크리에이터 둘러보기), opening with
  a filter toolbar, and byte-identical for a logged-out visitor and a fan holding 42 모찌.
  Using it as the landing surface made the app read as if it had no home, and the product's
  core loop (buy mochi → spend → creator fulfills) was invisible on the page every user
  landed on; the relationship data sat on `/me/mochi`, which they had to go find.
- **One URL per job**: `/` = the pitch (logged-out only), `/home` = the app home,
  `/explore` = browse. `/` was deliberately *not* made to serve both the landing and the
  home — the marketing landing has to stay its own page.
- **Order on `/home`**: 내 모찌 (balances) → 진행 중 (pending orders) → 소식 → a 4-card
  discovery strip. Your mochi first, because it's the product's core noun.
- **Adaptive zero-state**: 0 holdings (i.e. every new signup) → discovery-led with a
  three-step primer and 8 creator cards. The relationship layout would be four empty boxes
  on day one. Sections with no rows (`진행 중`, `소식`) don't render at all rather than
  showing empty states.
- **Constraints**: `/explore` is unchanged — the home never replaces it. Home queries live
  in `src/lib/home.ts`, **not** `mochi.ts`, so the money-invariant surface covered by
  `pnpm test` doesn't widen. The discovery strip filters out creators the user already holds
  mochi in. Signed-out visitors hitting `/home` get the landing, not a login wall. The nav
  brand links to `/home` when signed in on the consumer host (`/` elsewhere), and the
  dropdown gained a 홈 item. This also puts the `Update` model to work on the consumer side
  for the first time (it only rendered on profiles before).

## 2026-07-29 — No emoji in the UI, anywhere (build-gated)
Every user-visible glyph is a line icon from `src/components/ui/Icons.tsx`. **Supersedes
the 2026-07-24 carve-out** that kept "conventional glyphs (🔍 search, 🔒 lock)" as emoji —
those are now `IconSearch` / `IconLock`.
- **Rationale**: emoji render in the *OS emoji font*, so the same screen looks different on
  Windows / macOS / Android, they can't inherit brand color, and full-color pictographs next
  to a hand-built monochrome icon set is the loudest remaining AI-slop tell (owner's call).
- **Scope**: swept the search field, two 48px empty states, the backer-only lock, the
  SafetyStrip refund/lock badges, and **all 21 marketplace-item thumbnails** —
  `ThumbnailAsset.emoji` became `ThumbnailAsset.icon` (a component), so the tiles, the
  Studio picker, and every item card switched in one change. Seeded fan messages
  (💛🙌💪🎂) were stripped too — demo copy is product surface.
- **Guard**: `pnpm check:emoji` (`scripts/check-emoji.ts`) fails on any pictograph in
  `src/**` or `messages/*.json`, so the rule survives future sessions.
- **Not emoji**: typographic arrows (→ ← ↔ ↗) and check/cross marks (✓ ✕ ○) stay — they're
  punctuation, and the checker deliberately excludes those ranges.

## 2026-07-29 — Creator cover art is generated, not uploaded
Every creator gets cover art derived **deterministically from their handle**
(`src/lib/creatorCovers.ts` + `CreatorCover.tsx`): a palette-tinted field, the brand's soft
circles, and the creator's monogram. Replaces the grey "썸네일" placeholder box.
- **Rationale**: the placeholder made the whole browse grid read as unfinished — the single
  biggest "vibe coded" signal on the site. Same thesis as item thumbnails (2026-07-19):
  code-defined means no storage, no CDN, no moderation surface on a public grid.
- **Why derived, not stored**: no schema change and no creator action, so every existing row
  got a cover the moment it shipped. Swapping in real uploads later is a drop-in change
  inside `CreatorCover` — nothing else reads the tint tokens.
- **Also fixed**: the card, home spotlight, and profile rendered `@{displayName}` — an `@`
  glued onto a display *name*. Names now render plainly; the profile shows the real
  `@handle` separately. Explore cards dropped the three-percentage stat block for one human
  line ("38명이 응원하고 있어요"); the readiness grade still rides on the cover badge.
- **Constraint**: seed display names are now real Korean creator names (별하루, 밤편지라디오,
  …) while **handles stay `creatorA`–`creatorJ`**, so `@creatorA` references in CLAUDE.md
  and the seeded creator login keep working.

## 2026-07-24 — Unified navbar + avatar dropdown (one bar everywhere)
Every page/section/user type shares one `Nav`: brand left, a single avatar (initials
monogram) right, and **every link + logout inside a click-to-open dropdown** (`UserMenu`).
- **Rationale**: the old nav had a fan/creator `variant` split *and* the Studio ran a
  separate top bar — inconsistent chrome. One component, one avatar, is how YouTube/Twitch/
  Patreon work and reads as intentional, not assembled.
- **Context-aware, not variant-aware**: `Nav` reads the session and the request host, so the
  dropdown shows consumer items on the apex and Studio items (설정 / 공개 프로필) on `studio.*`.
  Links are path-relative — the middleware forwards cross-host ones in one hop.
- **Constraint**: the `variant` prop is gone; all call sites are `<Nav />`. Avatar is a
  monogram (no image pipeline); `Backer.avatarUrl` still isn't exposed to the session.

## 2026-07-24 — Signup role modal; login stays unified
A single 회원가입 button opens a **후원자 / 크리에이터 chooser modal** (`SignupModal`) instead of
forking the CTA into two links. 후원자 → `/signup`, 크리에이터 → `/api/become-creator`.
- **Rationale**: the login page had two competing prompts; one button + a modal is cleaner
  and mirrors Toonation's pattern (the reference the owner gave). The landing surfaces the
  same choice as two inline role buttons "at first glance" (no modal needed there).
- **Login is NOT split** — accounts are additive (one identity; a creator also owns a Studio),
  so there's a single login flow. Only signup forks (it's an intent choice, not a separate
  account). See [[additive-creator-model]] (2026-07-12).
- **Constraint**: `SignupModal` is **portal-rendered to `document.body`** — the nav's
  `backdrop-blur` creates a containing block that would otherwise trap the `fixed` overlay.

## 2026-07-24 — Landing funnels to signup, not browse
The logged-out landing hero leads with the two role CTAs; the **hero search and all 둘러보기
(/explore) links were removed from the body** (chips, "전체 둘러보기", the final-CTA explore
button). Footer explore links stay (shared chrome used on logged-in pages too).
- **Rationale**: owner's direction — a logged-out visitor should sign up, not browse. The
  landing renders only for logged-out users (signed-in users redirect to `/explore`), so
  this scopes cleanly to the logged-out experience.

## 2026-07-24 — Design language: line icons over emoji, circles over floating mochis
Design-review swaps that make the marketing surfaces read hand-crafted, not vibe-coded.
- **Emoji → line icons**: benefit cards (💌🎁🏅📒) and the creators feature/how-it-works
  grids (👥✅💸📈🔗🏅📄) now use a shared Feather-style set (`src/components/ui/Icons.tsx`),
  brand-colored (coral-deep / sage-text) on the existing tinted tiles. Emoji-as-icon was the
  strongest AI-slop tell.
- **Hero decorations → soft static circles** (matching the final CTA), replacing floating
  mochi glyphs. Brand mochi glyphs stay in the mochi-explainer section.
- **Root-cause fix**: `Mochi` no longer hardcodes inline `position` — it was overriding the
  `absolute` class and rendering decorations on top of the hero text (fixed site-wide).
- **Empty states**: 🍡 dango emoji → the real brand Mochi glyph.
- Conventional glyphs (🔍 search, 🔒 lock, ✓ form-checks) deliberately left as-is.

## 2026-07-24 — Studio on its own subdomain (studio.themotoo.com)
The creator console is split onto `studio.themotoo.com`; `themotoo.com` (www) stays the
consumer app. **One codebase, one Vercel project** — the split is host-based routing in
`src/proxy.ts`, not a second app.
- **How**: any host starting with `studio.` is the Studio host. There, clean URLs
  (`/` = dashboard, `/settings`) are **rewritten** into the internal `/studio` route group,
  and consumer/auth paths **308 to the apex**. On the apex, `/studio*` 308s to the subdomain.
  The creator gate runs in middleware off the JWT (`user.creator`) — no DB at the edge.
- **Shared login**: the session cookie is set on `.themotoo.com` (`AUTH_COOKIE_DOMAIN`, prod
  only) so one login works on both hosts. Only the session token gets the shared domain;
  CSRF/PKCE cookies (`__Host-` prefixed) forbid `Domain` and stay on the apex, where **all
  auth flows live** (login/onboarding/become-creator never move to the studio host).
- **Rationale**: a creator console and a consumer app are different products with different
  chrome; separate hosts make that legible and let the console evolve independently. One
  codebase keeps auth/DB/components shared (a creator is also a fan).
- **Constraints / gotchas**:
  - Studio pages are an explicit allowlist in `proxy.ts` (`/`, `/settings`) — **extend it when
    adding Studio routes**, or they'll be treated as consumer pages and bounce to the apex.
  - In-Studio links are root-relative (`/`, `/settings`); the apex `/studio*` rule forwards
    any legacy `/studio` link in one hop, so those weren't all rewritten.
  - The split only activates on `*.themotoo.com` / `*.localhost`; Vercel `*.vercel.app`
    previews keep the single-host behavior (serve `/studio` inline).
  - **Dev**: use `studio.localhost:PORT` (resolves to loopback automatically). Next's dev
    server relativizes a redirect whose target equals its `localhost` binding, which would
    loop the studio→apex consumer hop — so in dev that one hop serves inline instead of
    redirecting (prod redirects normally; its origins genuinely differ).

## 2026-07-20 — Studio settings entry lives in content, not the navbar
The creator-profile settings page (`/studio/settings`) is reached via a gear button in
the **dashboard header**, not the Studio top bar.
- **Rationale**: the navbar/top bar should stay consistent across every Studio page (chrome,
  not content). Settings edit the *creator profile* specifically, so the entry point belongs
  with the dashboard content. Keeps navigation predictable.
- **Constraint**: `handle` is read-only in settings — it's the public `/s/[handle]` URL, so
  changing it would break links; edited fields are display name, bio, type→category, and the
  six platform links, guarded by `updateStreamerProfile` (auth-scoped, category-must-match-type).

## 2026-07-20 — Section guidance as info tooltips, not inline subtitles
Studio section headers (모찌 추가 발행, 주문, 추천 아이템) put helper text behind an ⓘ icon
(hover/focus) instead of an always-on subtitle/hint line.
- **Rationale**: the forms read cleaner without paragraphs of guidance; the info is one hover
  away when needed. One shared `InfoTooltip` + a shared `creatorDashboard.helpLabel`.
- **Note**: the ratchet *warning* (raising the price discards leftover supply) stays inline —
  it's a live consequence of an action, not general help. 모찌 발행 설정 was renamed
  **모찌 추가 발행** (it issues *more* mochi; the old name implied first-time setup).

## 2026-07-20 — Single-view Studio dashboard (no sidebar)
The Studio is one scroll in a 2×2 grid (overview + issuance; orders + market items), columns
balanced to equal height. The scrollspy sidebar (`DashboardNav`) was removed.
- **Rationale**: everything already fit one page; the sidebar was navigation for content that's
  all visible at once. Removing it widens the content and simplifies the layout. Market items
  get the wider row-2 column (richest cards); the orders table compacts (stacked row actions)
  to fit the narrower column.

## 2026-07-19 — Marketplace item fulfillment modes (instant vs request)
A marketplace item declares how a redemption settles: `FulfillmentMode { instant, request }`
on `MarketplaceItem` (default `request`).
- **instant** (e.g. a vote ticket): `redeemItem` records the order **already `fulfilled`**
  (stamps `fulfilledAt`) — money still moves, but it never enters the creator's pending
  queue and, like any fulfilled order, can't be cancelled/refunded.
- **request** (e.g. a mission): stays `pending` for the creator to fulfil/cancel — the
  existing off-platform flow.
- **Rationale**: some perks need no creator action; forcing them through the pending list
  is noise. `fulfillOrder`/`cancelOrder` already gate on `status === "pending"`, so instant
  orders are automatically non-actionable — no special-casing.
- **Constraint**: instant redemptions are irreversible (no refund path) — chosen to match
  "completes instantly." Money invariants unchanged; the money test asserts both modes.
  `redeemItem` returns an `instant` flag so the fan sees mode-appropriate copy.

## 2026-07-19 — Item thumbnails are curated + code-defined, not uploads
Every marketplace item has a thumbnail, chosen from a curated set (`src/lib/itemThumbnails.ts`),
not uploaded. Each asset is a glyph on a palette-tinted tile defined in code (like `Mochi.tsx`
/ `Placeholder.tsx`); the item stores a stable `thumbnailKey` slug, never a URL.
- **Rationale**: no storage/CDN, no moderation surface on a public marketplace, and perfect
  brand consistency. Most items are intangible (votes, access, shout-outs) — there's nothing
  to photograph — so an iconographic tile fits better than stock imagery.
- **Safety**: `upsertItem` validates the key against the curated set (unknown → null), so a
  stale/forged key can never persist. `null` resolves to a per-`itemType` default, so legacy
  and blank items still look intentional.
- **Leverage**: keyed to the suggestion framework, so most items get a fitting thumbnail with
  zero extra clicks (the chip pre-selects it). Swapping emoji glyphs for custom SVG later is
  a drop-in change inside `ItemThumbnail` — no wiring touched.

## 2026-07-19 — Suggested items keyed on creator type
The Studio item section offers ready-made templates (`src/lib/itemSuggestions.ts`), grouped by
intent, chosen by the creator's **type** (streamer/youtuber/author) — not category. Clicking a
chip pre-fills the normal item form (title/description/price/type/thumbnail/fulfillment).
- **Rationale**: a blank item form is a cold start; type-scoped examples teach what a good
  perk looks like for *this* kind of creator. Type (not category) keeps the set small (~5/group)
  and always present. Nothing is binding — it's a seed the creator edits, so it reuses
  `upsertItem` with no new server action.

## 2026-07-14 — Mochi issuance: ratcheting price tiers (prepaid credit, not a security)
Mochi is fungible prepaid credit, minted **on purchase**, scoped to one creator. Once
bought it's the fan's — spendable or refundable **at the KRW paid**; the creator can
never claw back or devalue held mochi. The creator has two levers, available anytime
(onboarding or Studio):
- **Add availability** (same price): raise the current tier's `goalQuantity`.
- **Raise price** (new tier): set a higher per-mochi price. Price **only ratchets up**
  (new ≥ current, enforced client + server). A raise resets the tier meter
  (`soldQuantity → 0`) and **discards** leftover availability at the old price — harmless,
  since nothing was minted; unbought headroom just disappears.

- **Rationale**: gives an "early supporters got in cheaper" feel — a deliberate, legal
  workaround for an investment *feel* — while staying a prepaid credit. Existing holders
  are never affected; the only benefit is cheaper effective access to items.
- **The hard line**: the *mechanic* carries the momentum; the *copy* may not. No
  investment/return vocabulary (투자/수익/return/yield) — `pnpm check:vocab` is the build
  gate, §2 the rule. Let the rising number speak.
- **No speculation payout**: non-transferable + refund-at-paid ⇒ no buy-low-refund-high,
  no secondary market. Item prices stay fixed in mochi, so raising the mochi price is what
  makes everything pricier for latecomers.
- **Over-issuance** is disincentivised by obligation, not tokenomics: mochi is a
  refundable liability + a fulfillment duty + trust metrics. Issuing more does **not**
  dilute holders (mochi isn't equity), so there is deliberately no supply cap.

Data/constraints this creates:
- `MochiIssuance.soldQuantity` = the **current tier's** sold count (resets on a raise);
  `lifetimeSold` tracks total-ever for stats. `goalQuantity` = availability at the current
  price (the "X left" scarcity meter).
- `MochiHolding.krwPaidTotal` records lifetime KRW paid so refund-at-paid can be built
  later. **Not built yet**: the unspent-refund flow + exact per-lot refund accounting
  (needs a purchase-lot ledger). Deferred deliberately.
- No price-history table yet (future: show a creator's 100→200→300 ladder to fans).

## 2026-07-15 — Creator taxonomy: type (primary) → category (dependent)
`크리에이터 유형` is the primary facet — **streamer / youtuber / author** — and `카테고리`
is a dependent sub-facet whose options depend on the chosen type (e.g. author → 소설/웹툰/
일러스트/에세이). Single source of truth: `src/lib/creatorTaxonomy.ts` (`CREATOR_TYPES`,
`CATEGORIES_BY_TYPE`), used by the setup form's dependent dropdown, `createStudio`
validation, and the fan browse (explore filters, home chips, cards, `streamers.ts`).
- **Inverts the old browse model**: `category` used to be the primary browse facet;
  now `creatorType` is, and browse filters type-first then sub-category.
- Both `Streamer.creatorType` and `.category` stay plain `String` columns (no DB enum) —
  the taxonomy is validated in app code, so adding types/categories is a one-file edit.
- Studio is now a **single-page dashboard** (overview + issuance + items + orders on
  `/studio`; the `/studio/{mochi,items,orders}` sub-routes were removed). Creator-signup
  intent persists on the Backer row (`creatorIntent`), and a stale-session loop in the
  creator path self-heals via `/api/session-reset`.

## 2026-07-12 — Additive creator model (user base + Studio)
A creator is **a user who also owns a Studio** (`Streamer`), not a separate account
or a mode. Dropped `role: streamer` from all routing; creator status is derived from
Streamer ownership and surfaced as `session.user.creator` (handle or null).
- Rationale: how YouTube/Twitch/Patreon work — one identity, additive capability. A
  creator naturally wants to support other creators, which a role-toggle blocks.
- Constraint: `session.user.creator` lives in the JWT; the become-a-creator action calls
  `unstable_update()` so a new Studio shows up without re-login. `role` keeps only
  user/admin meaning. `/creator/dashboard` renamed to **`/studio`** ("Studio" — works for
  all creator types, not just streamers).
- **Become a creator = combined flow**: `/api/become-creator` routes a signed-in user to
  creator setup, or a logged-out visitor to signup while remembering the intent (cookie),
  so signup → onboarding → creator setup chains automatically.

## 2026-07-11 — Role-aware home; marketing demoted, not deleted
Logged-out visitors get the marketing landing `/`; every signed-in user is redirected to
`/explore` (the consumer home). The creator marketing page (`/creators`) stays public but
demoted (footer link), so creator acquisition still works without shoving it at everyone.
- Rationale: real products send signed-in users to their app home, not the pitch.

## 2026-07-11 — Fan onboarding + identity verification as an abstraction
Every new user completes `/onboarding` (nickname, unique `@handle`, 본인인증, terms),
enforced by `proxy.ts`. Age is a real **본인인증 step** behind a `VerificationProvider`
(mirrors `PaymentProvider`); the **mock** simulates a verified adult, persisted server-side.
- Rationale: a self-reported birthdate is theater; real age = 본인확인기관 (NICE/PASS/
  간편인증), which needs a `사업자등록` + paid contract (~₩40/verification) — same blocker
  class as the PG. Build the flow now, swap the adapter later (`VERIFICATION_PROVIDER`).
- Kakao login is blocked the same way (business verification); Google + Naver are free to
  register and are **live in dev**.

## 2026-07-11 — Auth split for edge middleware + self-healing sessions
Split Auth.js into `auth.config.ts` (edge-safe: session + `authorized` onboarding gate, no
Prisma) and `auth.ts` (providers + Prisma `jwt`); `src/proxy.ts` is the middleware (Next 16
renamed `middleware`→`proxy`). A stale cookie (deleted account, e.g. after a dev reseed)
self-heals via `/api/session-reset` instead of looping /onboarding ↔ /login.

## 2026-07-10 — Phase 3 follow-ups: order history, self-signup, tests
Built the buildable, verifiable slice of the Phase 3 backlog.
- **Order history** on `/me/mochi` (`getOrdersForBacker`) — users see redeemed
  items with status; **self-signup** (`/signup`, role=backer) + role-aware login
  redirect (creators land on the dashboard).
- **Tests**: `pnpm test` runs money-logic integration tests via Node's built-in
  runner + tsx (no new deps) against the docker Postgres, with isolated fixtures.
  Covers buy/redeem/cancel invariants and the two concurrency guards.
- **Real PG deliberately NOT built**: a faithful Toss/NICE adapter needs merchant
  credentials AND a redirect+confirm flow (an architectural change), so it's
  documented in PROGRESS.md rather than shipped as unverifiable code. Added a
  `voidCharge` compensation hook to the interface (mock no-op) for when it lands.

## 2026-07-10 — Phase 2 build: retire backing, per-creator holdings, creator auth
Built the mochi-marketplace. Key choices (user-approved):
- **Retire the Phase-1 backing flow** (tiers, `Backing`, `FoundingMembership`) from the
  UI — one clean spend path: buy a creator's mochi → redeem marketplace items. The
  models/routes stay in the tree but dormant. **Founding number dropped** from the new flow.
- **Per-creator mochi** via `MochiHolding` (unique [streamer, backer]); the Phase-1 global
  `Backer.currencyBalance` is left dormant. `MochiIssuance` holds price + soft-goal + sold.
- **Creator auth without a rename**: a creator is a `Backer` account (role=streamer) that
  **owns** a `Streamer` via `Streamer.ownerId`. Onboarding creates account + profile +
  issuance in one transaction and signs the creator in. `getCurrentCreator()` resolves the
  owned profile (dev-fallback `creator@motoo.dev` mirrors the fan dev-fallback).
- **Soft goal is not a cap**: buying past `goalQuantity` is allowed; the bar just shows
  >100%. Keeps mochi a consumable, not a scarce security (spec §2/§8).
- Constraint: fulfillment stays **off-platform** in v1 (orders record + creator marks
  done/cancels; cancel refunds the exact mochi and frees stock).

## 2026-07-09 — Pivot to the mochi-marketplace model
The demo's product is now: **a creator issues their own mochi; users buy it and
spend it in that creator's marketplace.** The Trust Report thesis from the original
handoff is shelved (schema/components kept, not featured).
- Rationale: product owner's direction for the final demo.
- Constraint: reshapes the data model (per-creator mochi holdings, marketplace items,
  orders) and adds creator auth/onboarding + dashboard.

## 2026-07-09 — Mochi supply = "capped as a soft goal"
> Evolved by the **2026-07-15 ratcheting price tiers** entry above — the soft goal is now
> per-tier availability and the price ratchets up. The "not a security" stance below still holds.

A creator sets quantity × price as a **target** (e.g. 100 × ₩200 = ₩20,000). Mochi is
prepaid credit spendable only in that creator's marketplace. **Non-transferable,
unspent-refundable, no resale/return.**
- Rationale: keeps mochi a consumable (별풍선 pattern), NOT a security. A hard
  scarce-supply "issuance" would drift into 조각투자 / 유사수신 territory, which the
  original spec §2/§8 forbids.
- Constraint: the cap is framed creator-side ("goal/target"), never sold to users as
  "invest in a raise." Banned-vocabulary check still guards all copy.

## 2026-07-09 — Marketplace items are guidelines; fulfillment off-platform in v1
Digital/experiential, access passes, physical goods, and 1:1 slots are all allowed
item types, but none must be fulfilled through motoo. v1 records the order/redemption;
the creator fulfills off-platform and marks status. On-platform fulfillment (e.g.
access passes) can come later.
- Rationale: product owner's guidance; keeps v1 scope tractable.

## 2026-07-09 — Database: Supabase Pro (Seoul), not Neon
Chose Supabase over Neon once the user confirmed an existing **Pro** plan.
- Rationale: Pro projects don't pause (Neon free scales to zero / Supabase free pauses
  after ~1 week); **Seoul region** available (Neon has none closer than Singapore);
  Storage included for future merch/avatar images; one dashboard/billing.
- No rework: Supabase is used purely as a Postgres host. Prisma connects via the
  pooler; **Auth.js is unchanged** (we do NOT use Supabase Auth or the Data API).
- Constraint: Data API disabled (we use Prisma, not supabase-js). Vercel region set to
  `icn1` (Seoul) to co-locate app + DB.

## 2026-07-09 — Hosting: Vercel; pipeline-first sequencing
Deploy to Vercel; stand up the pipeline before building the pivot so changes
auto-deploy to preview URLs.
- Rationale: Vercel is the native home for Next.js App Router + server actions;
  pipeline-first surfaces deploy issues early and gives live previews per change.

## 2026-07-08 — Two separate landing pages
`/` is the fan landing (default); `/creators` is a standalone creator landing we send
to creators directly. Fan page links to it via "크리에이터이신가요?".
- Rationale: product owner preference; creators get a dedicated link.

## 2026-07-08 — `FoundingMembership` table for the founding-number invariant
Founding number is assigned once per (streamer, backer) via a dedicated table with two
unique constraints; `Backing.foundingNumber` is a denormalized display copy.
- Rationale: a backer who backs repeatedly keeps the SAME number, so a unique
  constraint on `Backing(streamerId, foundingNumber)` is impossible. The membership
  table makes "assigned once, never reused/reordered" DB-enforced.

## 2026-07-08 — Prisma pinned to v6 (not v7)
- Rationale: Prisma 7 removed `url` from the schema datasource and requires driver
  adapters + `prisma.config.ts`. v6 is the smoother path for now; revisit later.

## 2026-07-08 — Korean-first, i18n-ready; integer KRW; mock PG
- `ko` default with `en` scaffold, no hardcoded strings (next-intl).
- Money stored as integer KRW, never floats.
- Korean PG stubbed behind a `PaymentProvider` interface (`mock` in dev); real
  Toss/NICE adapters left as documented stubs.

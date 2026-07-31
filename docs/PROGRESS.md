# motoo — Progress Tracker

_Last updated: 2026-07-31_

Living status of the build. Update the checkboxes as work lands. See
[`DECISIONS.md`](./DECISIONS.md) for why things are the way they are and
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for infra state.

## Recent — 2026-07-31 (Spotify-referenced sections, corrected to bare · local only, not yet deployed)

- [x] **Sections are bare, not boxed** — a first pass wrongly generalized Spotify's sidebar
  *widget* CSS into a whole-section panel; a real logged-in screenshot (owner-provided) showed
  Spotify's actual content shelves have no box at all, just a heading + a row of individually-
  shaped item cards. `src/components/ui/Section.tsx` now defaults to bare (`boxed` prop,
  default off); `/home`/`/profile`/`/ranking` stayed bare, `/settings` opted back into
  `boxed` deliberately (it's a form group, not a content shelf). Palette untouched throughout.
  See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked all four pages against the real reference.

## Recent — 2026-07-30 (full nav restructure: Sidebar, Ranking, Profile, Settings · local only, not yet deployed)

- [x] **Persistent left Sidebar** on every signed-in consumer page (`ConsumerShell`) — 홈/
  둘러보기 + the (strictly Follow-only) following list. Survives navigation instead of being
  a home-page widget, since it holds the very nav links you'd click.
- [x] **Nav restructure**: 랭킹 + 알림 are now plain icon-links (no dropdown — the bell lost
  its preview to match), a persistent **Studio pill** (routes to `/studio` or the
  become-a-creator flow depending on ownership — always visible), avatar dropdown trimmed
  to Profile/Settings/My channel + logout.
- [x] **`/ranking`** — a fan's rank among each supported creator's supporters, by lifetime
  mochi purchased (`src/lib/ranking.ts`), computed live. Also shown inline on `/home`'s
  balance cards.
- [x] **`/profile`** absorbs `/me/mochi` (holdings + order history) behind an identity
  header; old route redirects. **`/settings`** is new — nickname/handle (live availability,
  reused from onboarding) + password change (skipped for OAuth-only accounts).
- [x] **Follow-nudge on first purchase** — `BuyMochi` prompts a follow after a successful
  buy (holding and following stay independent by design; this is how the Sidebar's list
  still ends up complete). Fixed a real cross-component sync gap this surfaced: the header
  `FollowButton` and the nudge are separate instances, so the nudge now `router.refresh()`s
  and `FollowButton` adjusts its displayed state during render (not via `useEffect`, which
  the react-hooks `set-state-in-effect` rule correctly flags as an avoidable extra render).
- [x] **`HomeSignedIn` simplified** to two columns (mochi status + suggestions) — the
  Sidebar now carries what used to be its own following rail. Suggestions became larger
  single-column blocks (thumbnail + name), not the dense grid.
- [x] No schema change — everything reuses `Follow`/`Notification`/`MochiHolding` from
  earlier the same day. See DECISIONS 2026-07-30.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  **`pnpm build` clean** (23 routes), browser-verified the full flow signed in as both a
  fan and a creator — Studio pill both branches, avatar dropdown both variants, ranking
  page, profile, settings (handle-availability both states), and the follow-nudge → header
  sync fix, end to end.

## Recent — 2026-07-30 (notifications + follow list + home widened · local only, not yet deployed)

- [x] **Notifications**: new `Notification` model + `src/lib/notify.ts` (best-effort,
  called after the triggering action commits — never inside mochi.ts's tested
  transactions). Fires on: order fulfilled, order cancelled, a held/followed creator
  adds an item (stakeholders only, create-only so edits don't re-notify), a held
  creator raises their mochi price (holders only). Bell in `Nav` with an unread badge
  + dropdown (latest 6) → full `/notifications` page (mark-all-read, mark-on-click).
- [x] **Follow list**: new `Follow` model (free, distinct from `MochiHolding` and the
  dormant `Streamer.followerCount`). `FollowButton` on the profile header, optimistic
  toggle. **The home rail now merges holdings + follows** — a row shows a balance or a
  팔로잉 chip — and the two-column layout now triggers on "supports anyone" (holds OR
  follows), not "holds mochi", since following is free. News sources from the same
  merged set. See DECISIONS 2026-07-30.
- [x] **Home widened 1440 → 1600** to match `Nav`'s max-width; feed grids gained a
  `2xl` column so the width holds more content, not more whitespace.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  **`pnpm build` clean** (all 21 routes compile, including the two new ones), browser-
  verified the bell dropdown, mark-all-read, follow toggle (with live rail update), and
  the wide layout at 1920px.

## Recent — 2026-07-29 (signed-in home + design de-slopping · local only, not yet deployed)

- [x] **Real app home at `/home`** — signed-in users still redirect off `/`, but now to a
  home instead of to `/explore`. Leads with **내 모찌** (per-creator balances), then **진행 중**
  (pending orders), **소식** (updates from creators you hold mochi in — first consumer use of
  the `Update` model), then a 4-card discovery strip. **Adaptive**: zero holdings →
  discovery-led with a 3-step primer + 8 cards, so a new signup never sees empty boxes.
  `/` stays the marketing landing (logged-out only) and `/explore` stays the browse page —
  one URL per job. New `src/app/home/page.tsx` + `src/components/HomeSignedIn.tsx` +
  `src/lib/home.ts` (kept out of `mochi.ts` so the money-test surface doesn't widen).
  Nav brand → `/home` when signed in, plus a 홈 dropdown item. See DECISIONS 2026-07-29.
- [x] **Home rail + density pass** — sticky left **content** rail (응원 중인 크리에이터: total
  balance + per-creator balances + 주문 내역), container widened 1100 → 1440, and a new
  **지금 이용할 수 있는 아이템** section (items affordable with the balance already held,
  interleaved across creators — `getAffordableItems`). A nav-only sidebar was rejected: the
  fan side has just four destinations. The root cause of "too simple" was **data** — the demo
  fan held mochi in one creator; the seed now gives it 4 holdings + a second pending order,
  and seeded creator posts vary (6 templates) instead of every creator sharing one.
- [x] **Creator cover art** (`src/lib/creatorCovers.ts` + `CreatorCover.tsx`) — the grey
  "썸네일" placeholder box is gone. A tinted field + soft circles + the creator's monogram,
  picked deterministically from the handle: no schema change, no upload pipeline, every
  existing row covered instantly. Explore cards dropped the 3-percentage stat block for one
  human line (`{count}명이 응원하고 있어요`).
- [x] **Fixed `@{displayName}`** on the card, home spotlight, and profile — an `@` glued onto
  a display *name* (why everything read "@크리에이터E"). Profile now shows the real `@handle`
  separately. Seed display names are real Korean creator names; handles stay `creatorA`–`J`.
- [x] **No emoji anywhere in the UI** — swept 🔍 (3), 🔒 (2), ↩, all **21 marketplace item
  thumbnails** (`ThumbnailAsset.emoji` → `.icon`), and seeded fan messages. `Icons.tsx` grew
  10 → 32 line icons. New **`pnpm check:emoji`** guard fails the build on any pictograph in
  `src/**` or `messages/*.json`. See DECISIONS 2026-07-29.
- [x] Verified: `tsc` clean, lint clean on changed files, `check:vocab` + `check:emoji` clean,
  `pnpm test` 11/11, both home states browser-checked signed in as a fan with and without
  holdings, no console errors.

## Recent — 2026-07-24 (unified navbar + signup role modal + landing/design polish · deployed live)

- [x] **Unified navbar**: one bar for every page/section/user type — brand left, a
  single **avatar** (initials monogram) right; every link + logout live in a
  click-to-open dropdown (`UserMenu`). `Nav` is auth- **and** host-aware: consumer
  items on the apex, Studio items (설정/공개 프로필) on `studio.*`. The Studio dropped
  its custom top bar and uses the same `Nav`.
- [x] **Signup role modal**: the two forked CTAs (회원가입 / 크리에이터 시작하기) collapse into
  a single **회원가입** button that opens a 후원자 / 크리에이터 chooser modal (`SignupModal`,
  portal-rendered so the nav's `backdrop-blur` can't trap it; `SignupButton` trigger).
  후원자 → `/signup`, 크리에이터 → `/api/become-creator`. **Login stays unified** (additive
  accounts). Used in the nav + login page.
- [x] **Landing**: two role CTAs at first glance (후원자로 시작하기 / 크리에이터로 시작하기),
  unified login link, **hero search removed**, and **all 둘러보기 links removed from the
  body** (chips, "전체 둘러보기", final-CTA explore button). Footer explore links kept
  (shared chrome).
- [x] **Design-review pass** (`/design-review`): FINDING-001 — `Mochi` hardcoded inline
  `position:relative`, overriding the `absolute` class so decorative blobs rendered *on
  top of* hero text; removed it (fixes decorations site-wide). FINDING-002/003 — benefit +
  creator-tool emoji → brand-colored line icons (new `src/components/ui/Icons.tsx`).
  FINDING-004 — empty-state 🍡 dango → brand Mochi glyph. Hero floating mochis → soft
  static circles (matching the final CTA). See DECISIONS 2026-07-24.
- [x] Verified: `tsc`/lint/`check:vocab` clean, 11/11 money tests, browser-checked every
  surface, and **verified live on www.themotoo.com** (new hero/CTAs, line icons, signup
  modal, studio split intact, no console errors).

## Recent — 2026-07-24 (Studio split onto studio.themotoo.com)

- [x] **Two-domain routing**: `themotoo.com` = consumer app, `studio.themotoo.com` =
  creator console — one codebase/Vercel project, host-based routing in `src/proxy.ts`.
  Studio host serves clean URLs (`/` = dashboard, `/settings`) rewritten into the `/studio`
  route group; consumer/auth paths there 308 to the apex, and apex `/studio*` 308s to the
  subdomain. Creator gate runs in middleware off the JWT (no edge DB).
- [x] **Shared session** across subdomains via `AUTH_COOKIE_DOMAIN=.themotoo.com` (prod only;
  session token gets the domain, CSRF/PKCE cookies stay host-only). Login/onboarding/
  become-creator all stay on the apex.
- [x] Infra: `studio` CNAME at Squarespace → Vercel, domain added to the project, env var set.
- [x] Verified locally on `studio.localhost:3002` — both directions redirect with no loops,
  dashboard + settings render, apex landing intact; `tsc`/lint/`check:vocab` clean. See
  DECISIONS 2026-07-24.

## Recent — 2026-07-20 (Studio dashboard redesign + creator settings · deployed live)

- [x] **Single-view Studio dashboard**: sidebar removed (`DashboardNav` deleted); the
  dashboard is one scroll in a 2×2 grid — **overview + 모찌 추가 발행** (row 1), **주문 +
  마켓 아이템** (row 2). Columns are balanced to equal height (the overview's stats/progress/
  summary each fill a third; the mochi form fills its column); market items get the wider
  row-2 column, the orders table is compacted (stacked action buttons) so it fits.
- [x] **Guidance moved into ⓘ info tooltips**: the 모찌 추가 발행 (renamed from 모찌 발행 설정),
  주문, and 추천 아이템 headers each show an info icon on hover/focus instead of inline
  subtitle/hint text. Shared `InfoTooltip` + `creatorDashboard.helpLabel`.
- [x] **Creator taxonomy now displayed**: type · category shown under the Studio greeting and
  as chips on the public profile (`/s/[handle]`). New shared `CreatorFacet` component
  (`chips` + `text` variants), labels from `creatorTaxonomy.*`.
- [x] **Creator profile Settings**: new `/studio/settings` page + `updateStreamerProfile`
  server action (display name, bio, type→category dependent dropdown, 6 platform links;
  handle read-only). Entry is a gear **설정** button on the dashboard header — deliberately
  **not** in the navbar (chrome stays consistent across Studio pages). Save round-trip +
  profile revalidation verified.
- [x] **Marketplace item thumbnails/fulfillment/suggestions header polish**: 새 아이템 button
  moved into the 마켓 아이템 section header (right side); market-item cards render 2-up.
- [x] Verified: `tsc` clean, lint clean (changed files), `check:vocab` clean, `pnpm test`
  11/11, browser-checked the dashboard, settings save, and profile facet on the live dev server.

## Recent — 2026-07-19 (marketplace items: suggestions + thumbnails + fulfillment · Supabase live)

- [x] **Suggested items framework**: a creator opening 마켓 아이템 sees ready-made item
  templates for their creator type (streamer/youtuber/author), grouped by intent.
  Clicking a chip pre-fills the item form. Single source of truth
  `src/lib/itemSuggestions.ts` (i18n-keyed slugs); reuses `upsertItem`, no new action.
- [x] **Item thumbnails**: every marketplace item has a thumbnail — a curated glyph on a
  palette-tinted tile, **code-defined** (no uploads/storage/moderation), like `Mochi.tsx`.
  `src/lib/itemThumbnails.ts` + `ItemThumbnail`; new nullable `MarketplaceItem.thumbnailKey`
  (stores the slug, not a URL); server-validates the key (unknown → null). Suggestion chips
  pre-select one; a picker in the form overrides; itemType default when unset.
- [x] **Fulfillment modes** (`FulfillmentMode { instant, request }` on `MarketplaceItem`,
  default `request`): **instant** items auto-complete on redemption (order recorded
  `fulfilled`, never enters the pending queue — e.g. a vote); **request** items stay
  `pending` for the creator to act on (e.g. a mission). `redeemItem` sets status by mode
  and returns an `instant` flag (fan sees "바로 반영됐어요!" vs the request copy). Both
  cards show an 즉시/요청 badge. Money invariants intact.
- [x] **Deployment — Supabase initialized**: schema pushed + fully seeded to Supabase Pro
  (Seoul); connection verified. DB now has the new `thumbnailKey`/`fulfillment` columns.
  Vercel project import (`motoo`) + env vars + first deploy is the remaining step.
- [x] Verified: `tsc` clean, `check:vocab` clean, **`pnpm test` 11/11** (added an instant
  auto-fulfill case), both surfaces render on the live dev server. Pre-existing lint
  issues (OnboardingForm, Placeholder, design-handoff assets) untouched.

## Recent — 2026-07-15 (creator taxonomy + mochi economics + Studio UX)

- [x] **Creator taxonomy**: `크리에이터 유형` (primary: streamer/youtuber/author) → `카테고리`
  (dependent sub-facet). Shared source of truth `src/lib/creatorTaxonomy.ts`, wired
  through creator setup, server validation, and browse (explore filters, home chips,
  cards, `streamers.ts`). Seed diversified across all three types.
- [x] **Mochi issuance UX**: standard presets (10만/50만/100만) + custom, with floors
  (100원/10개/5만원) in `src/lib/issuance.ts`. One shared `MochiIssuancePicker`
  component used by both onboarding and the Studio editor.
- [x] **Mochi ratcheting price tiers** (see DECISIONS 2026-07-15): price only goes up;
  a raise opens a new tier (`soldQuantity` resets, leftover discarded); `lifetimeSold`
  tracks total; `krwPaidTotal` captured for a future refund flow. Held mochi never
  touched. Enforced client + server; money tests still green.
- [x] **Studio = single-page dashboard**: overview + 모찌 발행 + 마켓 아이템 + 주문 all on
  `/studio` (sub-routes `/studio/{mochi,items,orders}` removed), full-frame width,
  sections paired horizontally, item cards 2-up, issuance summary card, scrollspy nav.
- [x] **Creator-signup flow hardening**: `creatorIntent` persisted to the Backer row at
  onboarding (survives OAuth + long gaps), nav "크리에이터 되기 / 스튜디오" visible on
  mobile, and a stale-session redirect loop in the creator path self-heals via
  `/api/session-reset` (`become-creator` checks the Backer still exists).
- [x] Verified: `tsc` clean, `check:vocab` clean, `pnpm test` 10/10, browser-checked
  onboarding + Studio + explore filters + the ratchet.

## Current focus

1. **Phase 2 mochi-marketplace** ✅ — creator issuance + Studio + user buy/spend, verified locally.
2. **Phase 4 accounts** ✅ — auth-aware app, fan onboarding (본인인증 gate), and the **additive creator model** (a user who *also* owns a Studio). See below.
3. **Deployment** ✅ — **live at [themotoo.com](https://themotoo.com)** (Vercel + Supabase Seoul). Custom domain wired (Squarespace DNS → Vercel), OAuth callbacks set, auto-deploy on push to `main`.
4. **Consumer home** ✅ — signed-in users land on **`/home`** (balances → pending orders → news → discovery), adaptive for users with no mochi yet. `/` stays the marketing landing; `/explore` stays the browse page.
5. **Next** — design tier 2/3: the landing still repeats one section template five times, Latin eyebrows (`DISCOVER`, `HOW MOCHI WORKS`), English `STRONG`/`EMERGING` badges, unstyled native `<select>`s on explore, and Phase-1 vocabulary (백커·퍼크·트러스트 리포트) still on explore. Then real PG + real 본인인증 (both need a business registration + contract).

---

## Phase 1 — Foundation + landings + backing flow ✅ (built, verified)

- [x] Next.js 16 (App Router) + TypeScript + Tailwind v4, design tokens from the handoff
- [x] Design system: colors/fonts/mochi motif in `globals.css`, shared UI (`Nav`, `Footer`, `Button`, `GradeBadge`, `StreamerCard`, `SafetyStrip`)
- [x] i18n (next-intl): `ko` default, `en` scaffold, no hardcoded strings
- [x] Prisma + Postgres schema (integer KRW), seed script
- [x] Auth.js scaffold (dev credentials + Naver/Kakao/Google), roles `backer`/`streamer`/`admin`
- [x] `PaymentProvider` interface + mock (virtual "mochi" currency)
- [x] `/` fan landing + `/creators` creator landing (two separate pages)
- [x] `/explore` — trust-signal ranking (never money raised) + filters
- [x] `/s/[handle]` — profile + Backer Wall + Trust Report summary
- [x] `/s/[handle]/back` — age gate → tier → display → message → pay, disclosure + founding-number reveal
- [x] Banned-vocabulary check (`pnpm check:vocab`)
- [x] Verified: build passes, backing invariant holds, no 360px overflow, no banned copy

> Note: the Trust Report thesis is **shelved for the demo** (see the Phase 2 pivot).
> Its schema/components stay in the tree; they're just not the headline.

---

## Deployment — Supabase (Seoul) + Vercel 🔧 (in progress)

- [x] Prisma `directUrl` wired (pooled runtime / direct migrations)
- [x] `vercel.json` region `icn1` (co-located with Supabase Seoul)
- [x] `.env.example` documents Supabase pooled/direct strings
- [x] Supabase project created (Seoul, Data API off) — ref `nrfhwhefabahsfzuyxqu`
- [x] Code pushed to GitHub `junnwest/motoo` (main)
- [x] Schema pushed + seeded to Supabase (2026-07-19) — 10 streamers / 63 backers / 40 items / 10 holdings / 5 orders
- [x] Vercel project imported + env vars set + first deploy (2026-07-20)
- [x] Verify deployed site — `/explore` + `/s/[handle]` render 200 against Supabase, no console errors
- [x] Custom domain **themotoo.com** (Squarespace DNS → Vercel A/CNAME, Let's Encrypt TLS); www primary, apex redirects
- [x] Production OAuth callbacks added (Google + Naver)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the exact steps and env-var list.

---

## Phase 2 — Mochi-marketplace pivot ✅ (built, verified locally)

The product for the demo: a creator issues their own mochi, users buy it and spend
it in that creator's marketplace. Mochi = prepaid marketplace credit, **capped as a
soft goal**, non-transferable, unspent-refundable, no resale/return (see DECISIONS).

Verified: `pnpm db:push` + `db:seed` succeed; all Phase 2 routes render 200 with real
data; the buy → redeem → cancel-refund invariants hold end-to-end against Postgres
(buy credits, redeem debits, cancel refunds, KRW = qty × price); `tsc` clean, vocab passes.

### Creator side (the **Studio**, `/studio`)
- [x] Studio shell + guard (owns a Streamer) → `/studio` — **single-page dashboard**
      (overview + issuance + items + orders), 2026-07-15; sub-routes removed
- [x] Mochi issuance controls: ratcheting price tiers + availability + pause (shared `MochiIssuancePicker`)
- [x] Marketplace item CRUD (title, price in mochi, type, stock, active) — 2-up cards
- [x] Order view + mark-fulfilled / cancel-refund (fulfillment off-platform)
- [x] Become-a-creator setup (add-on to a signed-in user) → `/creator/onboarding`, entered via `/api/become-creator`

### User side
- [x] Discover creators (existing `/explore`)
- [x] Buy a creator's mochi (per-creator balance) — buy module on the profile
- [x] Spend mochi in a creator's marketplace (redeem items) — marketplace section on the profile
- [x] "My mochi" per-creator holdings → `/me/mochi`

### Data model changes (from Phase 1) — all landed
- [x] Creator: added gender, age, creatorType; `ownerId` links a creator account (Backer role=streamer) to its Streamer
- [x] Mochi: per-creator holdings (`MochiHolding`, unique [streamer, backer]); Phase-1 global `currencyBalance` left dormant
- [x] Mochi issuance config per creator (`MochiIssuance`: price, goal, sold)
- [x] `MarketplaceItem` + `Order` models (+ `MarketplaceItemType`, `OrderStatus`, `Gender` enums)
- [x] Phase-1 backing/tiers/founding-number **retired from the UI** (routes/schema kept dormant); founding number dropped from the new flow

### Phase 3 follow-ups ✅
- [x] User order/redemption history — a "주문 내역" section on `/me/mochi` (`getOrdersForBacker`)
- [x] User self-signup — real `/signup` form + action
- [x] Automated tests — `pnpm test` runs 10 money-logic integration tests (node:test via tsx) incl. the two concurrency guards

---

## Phase 4 — Auth, onboarding, accounts ✅ (built, verified locally)

### Auth
- [x] Real credentials login (`/login`) + self-signup (`/signup`) — split-layout, **social-first** (Kakao/Naver/Google) with email/password below a divider; password policy (8+ chars, letter+number) + confirm field
- [x] **Auth-aware app**: `Nav` is a server component reading the session; signed-in shows name + logout (+ Studio link for creators)
- [x] **OAuth**: **Google + Naver live in dev** (creds in `.env`, gitignored). Kakao stays a "준비 중" badge — blocked on business registration. Buttons activate the moment creds appear (`getEnabledOAuthProviders`)
- [x] Auth config split for edge middleware: `auth.config.ts` (session + `authorized`, no Prisma) vs `auth.ts` (providers + Prisma `jwt`); `src/proxy.ts` = the middleware
- [x] Stale-session self-heal: a cookie for a deleted account signs out via `/api/session-reset` instead of looping

### Onboarding (every new user, redirect-enforced by `proxy.ts`)
- [x] `/onboarding` — confirm nickname, pick a unique public `@handle` (live availability), **본인인증** (identity/age gate), agree to terms (필수) + marketing (선택)
- [x] **`VerificationProvider` abstraction + mock** (`VERIFICATION_PROVIDER`) — real 본인인증 = 본인확인기관 contract + business reg (like the PG). Mock simulates a verified adult, persisted server-side
- [x] `/terms` + `/privacy` placeholder pages

### Accounts — the additive creator model
- [x] **A creator is a USER who also owns a Studio** — not a separate account or a mode. Dropped `role: streamer` from routing; creator status = owns a `Streamer`, surfaced as `session.user.creator` (handle or null)
- [x] **Role-aware home**: logged-out → marketing landing `/`; every signed-in user → `/explore`; creators reach the Studio via a nav link
- [x] **Become a creator**: `/api/become-creator` — signed-in user → creator setup; logged-out → signup, remembering the intent (cookie) so the combined flow (signup → onboarding → creator setup) continues; `/signup` shows a creator-mode banner
- [x] Nav: **스튜디오** link for creators, subtle **크리에이터 되기** for users; marketing links only when logged out
- Dev logins: fan `demo@motoo.dev / motoo`, **creator `creator@motoo.dev / motoo`** (a user who owns `@creatorA`)

### Not built (need a business registration + paid contract — same blocker class)
- [ ] Real Korean PG (Toss/NICE / PortOne) — needs credentials **and** a redirect+confirm flow (see "Real payments" below)
- [ ] Real 본인인증 (NICE/PASS/간편인증) — ~₩40/verification + 사업자등록. PortOne aggregates PG + 간편인증 in one integration
- [ ] On-platform fulfillment; admin console; guardian-consent flow for minors

## Real payments — what a live PG needs (not built)

The current `PaymentProvider` is synchronous (`purchaseMochi` charges inline in a
server action) and only the **mock** adapter exists. A real Toss/NICE integration
is not a drop-in adapter — it needs:
1. **Merchant credentials** (secret key / sub-merchant onboarding) in env, not repo.
2. **A redirect-based flow**: create a payment → redirect the buyer to the PG →
   handle the success/fail callback → **server-side confirm** → then credit mochi.
   This replaces the current "charge inline, credit in the same request" shape.
3. **Webhook + reconciliation** for async settlement and refunds/voids (the
   `voidCharge` compensation hook exists but is a mock no-op today).
Until then, `PAYMENT_PROVIDER=mock` grants mochi without moving real money.

### Marketplace item guidelines (all optional, off-platform fulfillment for v1)
- Digital/experiential (Q&A slot, shout-out, song/topic request, priority chat)
- Access passes (members-only posts/streams, early access, event tickets)
- Physical goods (merch, signed items, letters — needs address + fulfillment)
- 1:1 time slots (short call/DM)
- Disallowed: financial return, mochi resale/transfer, lottery-for-value, regulated goods

---

## Frontend polish 🎨 (planned)

- [ ] Fix copy/phrasing issues (list to be provided)
- [ ] Fix design issues (list to be provided)

---

## Backlog / explicitly out of scope for now

- Streamer dashboard analytics, admin console, full Trust Report document + PDF
- Real Korean PG (Toss/NICE) sub-merchant integration
- On-platform fulfillment for access passes / digital perks
- Real age verification + guardian consent flow

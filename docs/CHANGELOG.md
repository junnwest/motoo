# motoo — Changelog

What shipped, newest first. **This file is history — it is not a resume point.**
For current status and open work see [`PROGRESS.md`](./PROGRESS.md); for *why* a thing is
the way it is see [`DECISIONS.md`](./DECISIONS.md).


## 2026-08-31 — creator avatar at setup, and a one-time marketing re-ask

- **Fixed: logout did nothing on the pre-launch confirmation page.** It was a
  `<Link href="/api/logout">` — a GET. That route exports **POST only**, so the
  request never matched it, the page re-rendered, and the session survived. Now a
  native form POST, matching `UserMenu`. The POST is also what bumps
  `Backer.tokenVersion`, which is the actual revocation gate: clearing the cookie
  alone is undone by any in-flight request still carrying the old one, since
  Auth.js re-issues it on every authenticated request. Exactly the trap DECISIONS
  2026-08-02 documents, reintroduced by a new page that did not follow it.

- **Profile picture in creator setup.** `/creator/onboarding` now takes an avatar
  through the existing `ImagePicker`, above 활동명 — that page is where the public
  creator profile is built and where an avatar actually shows. Optional and
  skippable. The data URL goes through `parseImageDataUrl`/`AVATAR_SPEC` on the
  server like every other upload, and a malformed crop becomes null rather than an
  error: a bad image must not cost someone their Studio at the last step of setup.
- **One-time marketing re-ask.** Owner's call: we need a way to reach pre-launch
  creators at launch, so a declined 마케팅 수신 동의 is asked once more after
  onboarding, on the confirmation page. New `Backer.marketingPromptedAt` is set
  **whichever way they answer**, which is the safeguard — 마케팅 수신 동의 is 선택
  by law, cannot be a condition of using the product, and repeatedly re-asking a
  declined consent is the pattern Korean guidance is least comfortable with. One
  follow-up is defensible; a nag is not. Declining is an equally-weighted button,
  and a "no" leaves the original consent untouched rather than rewriting it.

Recommended instead, and not taken: a purpose-limited "출시 알림" consent rather
than re-asking for generic marketing. It reads as a service notification for the
thing these creators signed up for, and a single "no" would not then block the
launch notice as well. Recorded here because the choice is the owner's, and
because it stays available later.

## 2026-08-29 — pre-launch goes live on themotoo.com

The gate from 2026-08-28 shipped to production, plus the refinements that came out
of walking the invited creator's path end to end. Rationale in DECISIONS
2026-08-29.

- **Pre-launch now means unlaunched, not hidden.** The gate was
  `PRELAUNCH && !user`, which waved through every account that existed before the
  flag was switched on — 64 locally, and in production everyone who had already
  signed up. Three tiers now: signed out gets the welcome and legal pages, signed
  in gets onboarding and settings, **admins get the product**.
- **The invite link opens an invitation.** `/join/<token>` validates, parks the
  token and lands on `/join` — a dark letter with an 초대장 seal, the four founding
  benefits and one accept CTA. It used to drop the creator on the ordinary signup
  page, whose hero was a *fan* pitch. `/join` also carries the "link didn't work"
  and "you need a link" states.
- **Settings reachable during pre-launch.** A founding creator can edit the handle
  they reserved — `/studio/settings` for the creator profile, `/settings` for the
  account. Showing a promised handle that cannot be corrected makes a typo
  permanent until launch.
- **"Setup unfinished" is no longer "wait for launch".** A creator who signed up
  but stopped before Studio setup was told to sit tight directly above a button
  asking them to finish.
- **OAuth signup is invite-gated too.** OAuth users are provisioned lazily in the
  `jwt` callback and never touch `signupUser`, so `/login` — public by necessity —
  was a way to get an account without an invite. A `signIn` callback now denies new
  OAuth accounts without one; existing accounts always pass.

**Deployed and verified on themotoo.com**: `/` serves the pre-launch page,
`/explore`, `/home`, `/s/[handle]` and the studio host all redirect, and `/refund`,
`/terms` and `/login` stay reachable.

**The first deploy shipped publicly open for several minutes.** `PRELAUNCH` is read
in edge middleware, and Next inlines env vars into the edge bundle at build time —
the variable was set while that build was already running. A rebuild fixed it in
fifteen seconds. The flag now tolerates whitespace and case, and DEPLOYMENT records
that changing it needs a rebuild, not just a redeploy.

## 2026-08-28 — pre-launch: the site goes invite-only

Creator collection starts before launch, so the product is private and only
creators we contact directly can sign up. `PRELAUNCH=1` turns it on; unsetting
the variable and redeploying is the launch. Rationale in DECISIONS 2026-08-28.

- **`Invite` model + `Backer.foundingAt`** (migration `prelaunch_invites`). One
  row per creator approached, so the table doubles as the outreach record. Single
  use is a conditional update inside the redemption transaction — tested under
  concurrency: exactly one winner, loser's founding mark rolled back.
- **The gate** lives in `src/proxy.ts` for pages and — the one that matters — in
  `signupUser` for account creation, since a server action can be called directly.
  The invite token rides in an httpOnly cookie, never a form field. Nothing on the
  studio host is public, including `/`.
- **Public surface**: the welcome page, login, `/join`, and the legal pages
  (`/terms`, `/privacy`, `/refund`, `/youth`) — the last four deliberately, since
  `/refund` is an obligation and the terms are agreed at onboarding.
- **`/join/<token>`** is a Route Handler (cookies cannot be set from a Server
  Component); `/join` renders which of invalid / revoked / already-used happened.
- **Admin invite management** — mint, copy link, revoke. Revoking never deletes,
  and a redeemed invite is not revocable.
- **Founding badge** on the creator profile, read through `Streamer.owner` rather
  than mirrored onto `Streamer`, so there is one source of truth.
- **Dead ends closed**: the nav's 회원가입 button and the footer's explore column
  both pointed at things the gate makes unreachable, and are hidden while
  invite-only.

## 2026-08-28 — the brand overhaul

A single session, owner-driven, working outward from the logo. Rationale for each
piece is in [`DECISIONS.md`](./DECISIONS.md) (six entries dated 2026-08-28).
Everything below passes `pnpm lint`, `check:vocab`, `check:emoji`, `check:a11y`
(11/11) and `next build` (34/34).

- **The logo is the wordmark.** `BrandMark` deleted; `BrandLogo` and the footer are
  wordmark-only. New `BrandWordmark` renders **Bauhaus 93 as SVG outlines**, not a
  webfont — its licence permits creating artwork but not redistributing the font or
  serving it, so outlines are the only compliant route (and they render identically
  for everyone who has never had the font installed). Favicon, apple-icon and both
  PWA icons regenerated as a lowercase `m` monogram from the same outlines.
- **Brand orange → `#ff5722`.** The other four coral roles and the warm surfaces
  were re-derived in OKLCh rather than hand-picked: each keeps its own lightness,
  with chroma scaled and hue shifted by the base's deltas.
- **The page background is white.** `--color-cream` `#fee9e1` → `#ffffff`; the warm
  tints deliberately stayed put so they now read as deliberate bands. Side effect:
  `coral-deep` on the page went 4.02:1 → **4.70:1**, clearing AA for link text for
  the first time.
- **Mono removed.** IBM Plex Mono ships `latin` only, so the ten Korean `font-mono`
  call sites had been falling back to an OS font — the hero eyebrow rendered two
  typefaces in one line. `tabular-nums` replaces it for the numerals that actually
  wanted fixed-width digits. With Fredoka and Baloo 2 also gone, the project now has
  **zero `next/font` imports** and makes no third-party font request.
- **The Bauhaus pass, applied through tokens** so all 34 routes moved together.
  Two-state geometry (rectangles square-cornered, `rounded-full` untouched); the
  five shadow tokens redefined as hard `0 0 0 1px` outlines instead of blur; the
  mochi flattened (gradient *and* its two inset lighting shadows — then redone
  properly, below). `src/` now has
  **zero hardcoded radii and zero hardcoded shadows** — the audit that found this
  also turned up `#e08a6f` still living in `ErrorState.tsx`, a terracotta retired
  on 2026-08-20.
- **All 41 icons rebuilt** on a stated construction spec (20×20 live area, optical
  rather than metric sizing, 16px legibility). `Studio` and `Camera` had been the
  same drawing; `Scroll` read as nothing; `Dice` drew its pips as zero-length paths
  that vanished small. Exact export parity, so no consumer changed. Drawn in the
  Feather idiom rather than copied, so no upstream licence obligation.
- **The logged-out landing rebuilt, twice.** Structure first (eight background bands
  → three, the full-bleed orange block gone, a real stat rail from
  `getLandingStats`), then the copy: it now leads with `후원금은 크리에이터에게
  그대로. / 모투 수수료 0%.` rather than a line any tipping product could run. Found
  and fixed a factual error carried since the donation pivot — step 2 read `모찌
  보내기`, but fans don't send mochi, they donate and receive it.
- **The mochi is now an SVG that inherits `currentColor`.** The first flatten made it
  worse: a hard-stop ellipse replaced the gradient's soft falloff, so on white, `panel`,
  `coral-chip` and `sand` the lower half merged into the background and the mochi read as
  a crescent, while on solid `coral` the body vanished instead. Fixed fills were always
  going to collide across six surfaces — one flat silhouette coloured by context cannot.
  `text-coral-deep` where the mochi is the subject, `text-coral-soft` for the decorative
  floaters.
- **Fixes found along the way.** The signup modal's 후원자 icon was a hand-rolled
  inline SVG bypassing `Icons.tsx` — filled where everything else is stroked, and
  geometrically lopsided; it is `IconHeart` now, and both role tiles are white with
  the hairline border that keeps them visible when the card turns white on hover.
  `Mochi` now **requires** `width`/`height` (the defaults were dead across all 49
  call sites) and warns in dev if a sizing class is passed, because inline styles
  silently beat Tailwind — which is exactly how the explainer shipped a 26×21 blob
  crammed into a 28px circle.


## 2026-08-18 — the pre-launch sweep (25 of 36)

Worked straight down [`PRELAUNCH.md`](./PRELAUNCH.md). Everything below is on `main`
and deployed. What is left there is almost entirely owner-side — see
[`OWNER-ACTIONS.md`](./OWNER-ACTIONS.md).

- [x] **Refunds (#8), and the ledger underneath them.** `/refund` had promised a 7-day
  청약철회 "if not one mochi from that donation has been spent" since 2026-08-06, and
  donations were never recorded — only summed — so neither half was answerable. A
  `Donation` row now writes inside `donateMochi`'s transaction. Request form on `/profile`,
  triage queue in `/admin`. Eligibility needed an interpretation and the obvious one was
  wrong: "balance ≥ what this donation granted" lets a fan spend a donation, donate again,
  and watch the first turn eligible. The rule is the balance covering this donation *and
  every one after it*. A completed refund also claws the mochi back.
- [x] **청소년보호정책 (#9) + guardian consent (#31).** The money path had refused
  unconsented minors since the eligibility work and nothing could ever record consent, so the
  branch was correct, tested and unreachable. `/guardian-consent` records a declaration —
  gated on 본인인증, never on the form — and says plainly that it is not a verification.
- [x] **Blocking, both directions (#13).** A fan hides a creator (curation); a creator blocks
  a fan (safety). A creator block stops donations, follows and leaderboard presence but
  deliberately **not** spending mochi already held — blocking a supporter must not confiscate
  their balance.
- [x] **Loading states (#25) and pagination (#24).** `loading.tsx` everywhere via
  `ShellSkeleton`. Pagination's real work was moving explore's sort and supporter-band filter
  into the database; both ran in JavaScript over a capped fetch.
- [x] **Global search (#27).** Creators, items and posts, in three grouped sets.
  Supporter-only posts are excluded outright rather than listed-and-locked.
- [x] **Notification preferences (#28).** Mutable for a creator's activity, mandatory for
  outcomes on your own order.
- [x] **Creator settlement view (#29)** — built on the donation ledger, with both caveats
  printed: donated ≠ paid out, and the ledger starts 2026-08-18.
- [x] **Order disputes (#30).** Cancelling covered a pending order; this covers a fulfilled
  one that never arrived. Closing belongs to the fan.
- [x] **Fulfillment promises (#32).** Stamped onto the order at redemption, so a creator
  cannot move a deadline they already gave.
- [x] **Post takedown (#15, rest) — and the buttons item takedown never got.**
  `hideItemAction` had shipped with no caller anywhere; takedown was unreachable from the
  console. Both are now wired into the report queue.
- [x] **Mobile follow list (#26), CSP enforcement (#34), query measurement (#35),
  automated a11y (#33).** CSP rejected `'strict-dynamic'` on evidence from a production
  build. `DEBUG_QUERIES=1` showed the tracked query counts in this repo were both wrong.
  axe found two missing `main` landmarks.

### Later the same day — the owner's decisions, and what production actually contained

- [x] **Production was running the dev seed.** Found while debugging admin access:
  `fan*@motoo.dev` accounts were in the live database, so **63 of 70 accounts and 10 of 12
  creators** were fixtures counted in every supporter total on the site. The seed's
  `admin@motoo.dev` (password `motoo`, in a **public** repo) was a live admin login.
  Passwords nulled immediately, then removed properly with `pnpm seed:audit` /
  `pnpm seed:remove` — the audit caught that a blind `DELETE` would have cascaded through a
  real mochi holding. Production is now 7 accounts, 2 creators.
- [x] **Sentry** behind `REPORT_PROVIDER`, server-side only — the browser half would need
  Sentry's host in the enforced CSP *and* a third-party script, which would drag the cookie
  banner in.
- [x] **Vercel Analytics** (#17), chosen because it needs no banner and no CSP widening.
  Closes #10 with it.
- [x] **A confirmed email is now required to donate** (#3, owner's call) — plus the
  **Resend adapter** (#2's other half), because enforcing the gate while production ran the
  mock provider would have meant nobody could donate and nobody could fix it.
- [x] **Routing tests** (#20) — the host predicates moved out of `proxy.ts` to be testable
  at all.

Tests 26 → 108. `pnpm check:a11y`, `pnpm seed:audit`, `pnpm seed:remove` added.

## 2026-08-10 (design pass — on `design/polish`, not yet merged)

- [x] **One type/radius/leading/motion scale.** 41 font sizes → 12, 13 radii →
  5, 12 line-heights → 4, plus the motion tokens that did not exist. 560 values
  across 69 files, mapped to the nearest step.
- [x] **Density correction** after owner feedback that everything read too
  large — it did, and the first pass caused it. Every type step down one notch;
  buttons ~46/60px → ~38/46; the primary button's 24px coral halo halved.
- [x] **Four pages given a hierarchy**: `/s/[handle]` (dead desktop gap closed,
  three identical panels → three weights, leaderboard podium, coral slabs → the
  price leads), `/home` (balance elevated, items flat, orders and news become
  lists), `/` (one section rhythm, one heading scale, one alignment rule),
  `/studio` (the orders table was breaking 대기 중 one character per line).
- [x] **motion** on the shared Modal and the donation success state; both
  respect `prefers-reduced-motion`.
- [x] **Pretendard self-hosted** as a 92-file dynamic subset; CSP dropped its
  jsdelivr exception.
- [x] **`/ranking` deleted.** It rendered the same `getMyRankings` rows as
  `/home`, linking to the same pages, behind `NOINDEX`. Rank moved to
  `/profile`'s holdings, where it was missing. No global leaderboard: mochi is
  not comparable across creators, and the only comparable field would make it a
  public ranking of who spent the most money. See DECISIONS.

## 2026-08-10 (production baselined onto migrations; the audit branch is live)

- [x] **Production baselined and deployed.** Six Phase-1 tables and 910 rows dropped,
  `0_init` marked applied, and the build applied
  `20260810020000_donation_pivot_rename` — so the mochi lifetime totals were *renamed*,
  not reset, which a `db push` would have done. Live data intact: 70 backers, 12
  streamers, 11 holdings, 5 orders. `/s/[handle]`, `/s/[handle]/donate` and the OG image
  render 200 with a populated leaderboard; they had been 500ing since `main` deployed the
  pivot against pre-rename columns.
- [x] **`DATABASE_URL` / `DIRECT_URL` scoped to Production only**, closing the path where a
  preview build from an unmerged PR could migrate the production database.
- [x] Three process lessons, all recorded in the runbook because each cost real time:
  `vercel env rm NAME preview` deletes the whole variable rather than one target; piping a
  value into `vercel env add` stored something P1013-invalid and failed a deploy; and
  sensitive variables can't be read back, so `vercel env pull` returning empty proves
  nothing — only a build verifies a value.

## 2026-08-10 (merged `main`'s donation pivot into the audit branch)

- [x] **Merged `origin/main` into `audit/product-hardening`** — 18 conflicting files across
  the money core, the actions, the copy catalog and all six docs. The two branches had
  changed the same surface from different directions: `main` renamed buy → donate, the
  audit branch had hardened buying (per-transaction ceilings, donor eligibility, rate
  limiting, the N+1 fix in `ranking.ts`). Every hardening rule was kept and re-expressed
  in donation terms: the unit ceiling now binds the *granted* bonus and the KRW ceiling the
  donation amount, both still checked before the PG is called.
- [x] **The pivot's schema rename became a migration.** `main` shipped it as a bare
  `db push` that reached only local dev, leaving prod's mochi pages pending a manual
  `--accept-data-loss` push. The audit branch had already moved schema changes onto
  migrations applied by the build, so the rename is now
  `prisma/migrations/20260810020000_donation_pivot_rename` — `ALTER TABLE … RENAME COLUMN`,
  which preserves the lifetime totals a drop-and-recreate would have lost.
- [x] **Explore's chevron moved into the shared `Select`.** `main`'s local `FilterSelect`
  and the audit branch's `Select` primitive solved overlapping halves of the same problem;
  merged into the primitive, so every select in the app gets the treatment.
- [x] **`messages/en.json` stays deleted** (2026-08-07 decision), and the donation copy
  `main` added to it was dropped with it. `donate.errors` gained the audit branch's
  eligibility/ceiling/rate-limit keys, reworded for donation.

## 2026-08-10 (pushed to `main` — production schema migration still pending)

- [x] Committed and pushed this session's full changeset (donation pivot, dev-environment
  fixes, 고객센터, design tier 2/3) to `main`.
- [ ] **Known, accepted gap** (since resolved by the merge above): the donation-pivot's
  destructive schema rename (`purchasedTotal`/`soldQuantity`/`lifetimeSold` →
  `mochiEarnedTotal`/`grantedQuantity`/`lifetimeGranted`) was only pushed to local dev
  Postgres, never to Supabase prod — Vercel's build doesn't run `db push`, and nobody on
  this session had `.env.production.local`. Owner chose to push code first anyway
  (DECISIONS 2026-08-10) rather than wait. It is now carried as a migration on
  `audit/product-hardening`, where the build applies it.

## 2026-08-10 (design tier 2/3, and de-boxing the landing's repeated cards)

- [x] **Translated the last Latin-script surface on the landing pages** — `Eyebrow`
  renders its text `uppercase` via CSS, so lowercase-English source copy
  (`"discover"`, `"how mochi works"`) was showing as `DISCOVER`/`HOW MOCHI WORKS`. Fixed
  the 5 live keys across `fanLanding`/`creatorLanding` (+ 1 dead one in `explore`, fixed
  in passing) — Korean only, `en.json` untouched since English eyebrows are correct there.
- [x] **Explore's 4 filter `<select>`s get a real chevron** — new `IconChevronDown` in
  `src/components/ui/Icons.tsx`, a local `FilterSelect` wrapper in `ExploreFilters.tsx`
  (`appearance-none` + the icon absolutely positioned) replaces each browser's own
  disclosure-arrow glyph, which no amount of `className` could touch.
- [x] **퍼크 (Phase-1 vocabulary) reworded to 혜택/아이템** in the 3 spots that are
  actually live: `fanLanding.benefits.perksBody`/`.dashboardBody`,
  `creatorLanding.how.step2Body`. Left the unused `perkTitle`/`perkBody`/`tierPerks` keys
  alone (zero imports — dead code, not a copy bug).
- [x] **Two of PROGRESS's four design-tier-2/3 items turned out already resolved** —
  `STRONG`/`EMERGING` badges live in `src/lib/grades.ts`, which has had zero imports since
  the Trust Report's removal (DECISIONS 2026-08-01); and "퍼크 still on explore" wasn't
  actually true — no 퍼크 reference exists in the `explore` namespace at all, it was on
  the landing pages instead. See DECISIONS 2026-08-10 for the full per-item breakdown.
- [x] Verified: `tsc` clean, `check:vocab`/`check:emoji` clean, ko/en key parity holds,
  `pnpm build` clean (26 routes), `pnpm test` 13/13, `pnpm lint` matches the documented
  2-error baseline. Confirmed via server-rendered HTML (curl) that the Korean eyebrow text
  and exactly 4 matching chevron SVGs render — no headless-browser tool available in this
  environment for a pixel-level screenshot check, worth a manual look in a real browser.
- [x] **De-boxed the landing's two single-item card sections** — "Mochi explainer" and
  "Are you a creator?" were `rounded-[24px] border border-line-2` cards; asked the owner
  first (a past session guessed wrong on a similar visual call and got corrected — see
  DECISIONS 2026-07-31) rather than assume. Owner picked de-boxing over "keep boxed, vary
  color" or "hold for a mockup." Both sections are now full-bleed color bands
  (cream-warm / dark ink), matching the page's own Final CTA section — the one section
  that already avoided the repeated-card look. Benefits (4 items) and Spotlight (a real
  profile chunk) kept their cards. Verified via server-rendered HTML: the old card markup
  is gone from both changed sections, present and unchanged on the two that stayed boxed.

## 2026-08-10 (local dev environment actually works; Prisma 7 deprecation cleared)

- [x] **This machine had never had `pnpm install` run, for any part of this repo.** Fixed
  properly: installed `pnpm` globally, ran `pnpm install`, approved the legitimate native
  build scripts in `pnpm-workspace.yaml`'s `allowBuilds` (`@parcel/watcher`,
  `@prisma/client`, `@prisma/engines`, `@swc/core`, `esbuild`, `prisma`). `.env` didn't
  exist either — created from `.env.example` (local Postgres + a freshly generated
  `AUTH_SECRET`).
- [x] **The donation-pivot schema rename is live** on local dev — `prisma db push` (run
  with the correct pinned Prisma 6.19.3, not the unpinned 7.x a bare `npx prisma` had
  grabbed) applied `mochiEarnedTotal`/`grantedQuantity`/`lifetimeGranted` cleanly. No
  migration-history workflow here (`db push` + `db:seed` is the documented local flow),
  so there was no SQL to hand-inspect.
- [x] **`package.json#prisma` → `prisma.config.ts`** (PROGRESS's "small" maintenance item,
  now done): the seed command moved out; the now-dead `pnpm.onlyBuiltDependencies` in
  `package.json` (superseded by `pnpm-workspace.yaml`'s `allowBuilds`) was removed in the
  same pass. Still the classic engine (`schema.prisma`'s own `url`/`directUrl`) — this is
  not the bigger Prisma 7 driver-adapter migration. One real gotcha: a `prisma.config.ts`
  file turns OFF Prisma's automatic `.env` loading, so the config calls
  `process.loadEnvFile()` itself (Node's native loader — no `dotenv` dependency added).
- [x] Verified for real, end to end: `pnpm test` 13/13, `tsc --noEmit` clean, `check:vocab`
  clean (caught and fixed a real substring false-positive — "후원금" contains the banned
  term "원금"; reworded rather than touching the checker), `check:emoji` clean, `pnpm
  build` clean (26 routes), `pnpm lint` matches the documented 2-error baseline exactly.
- [x] **고객센터 wired up** — a real, open item since the `/refund` work: the footer's
  support links and `/refund`'s "how to request" section now point at a real `mailto:`
  (`SUPPORT_MAILTO` in the new `src/lib/support.ts`), the owner's personal email as an
  explicit stopgap. `/refund`'s `howTo.body` moved from plain `t()` to `t.rich()` so
  "고객센터"/"Contact support" is an actual link, not just text naming a channel that
  didn't go anywhere. `docs/legal/privacy-draft.md`'s placeholders updated to match, with
  a new review-point flagging the personal-email-as-DPO-contact question for counsel.
  Verified: `tsc`, `check:vocab`, `check:emoji`, `pnpm build` all clean after.

## 2026-08-09 (mochi becomes a donation bonus, not a purchase — the donation pivot)

- [x] **`buyMochi()` → `donateMochi()`.** A fan now donates a KRW amount directly to a
  creator (100% passthrough, unchanged — motoo never took a cut structurally, only the
  framing changed); mochi is granted afterward as a non-purchased bonus,
  `mochiGranted = floor(donationAmountKrw / pricePerMochiKrw)`, computed by motoo before
  charging. `PaymentProvider.purchaseMochi` → `.donate`, and no longer returns a
  `mochiGranted` field — that was always motoo's own math riding along in a PG-owned
  response. New guard: a donation below the current rate is rejected
  (`DONATION_BELOW_MIN`) rather than silently granting a 0-mochi "bonus."
- [x] **The ratcheting price-tier mechanism needed no mechanical changes** — a KRW/mochi
  ratio means the same thing read as "cost to buy" or "cost to earn a bonus," and
  "price only rises" is the same rule as "bonus rate only shrinks." `src/lib/issuance.ts`
  and `MochiIssuancePicker.tsx` are untouched; only surrounding copy moved from
  발행/판매 (issue/sell) framing to 보너스 지급 (bonus-grant) framing.
- [x] **Three field renames**: `MochiHolding.purchasedTotal` → `mochiEarnedTotal`,
  `MochiIssuance.soldQuantity` → `grantedQuantity`, `.lifetimeSold` → `lifetimeGranted`.
  `krwPaidTotal` keeps its name. Ranking/leaderboard basis deliberately stays
  mochi-earned (not switched to KRW-donated), knowingly accepting the rate-distortion
  trade-off that creates.
- [x] **Route + component renames**: `/s/[handle]/buy` → `/s/[handle]/donate` (permanent
  redirect added for the old URL), `BuyMochi.tsx` → `DonateMochi.tsx`, its interaction
  inverted (donation-amount presets in, a derived mochi-bonus preview out, instead of a
  mochi-quantity stepper in, a derived KRW total out).
- [x] **`messages/*.json`'s `marketplace` namespace split**: a new `donate` namespace
  (acquisition copy, entirely reworded to donation framing) and a trimmed `marketplace`
  namespace (redemption copy — spending earned mochi on items — unchanged, since that
  side of the model didn't change). Swept the buy-flow disclosure, onboarding subtitle,
  signup hero, landing "how mochi works" steps, age-verification copy, and the
  ranking/leaderboard subtitles for lingering "구매"/"buy mochi" language.
- [x] **`/refund`'s copy reworded, its mechanic preserved, not re-derived** — "구매"
  (purchase) framing became "후원" (donation) framing without changing the underlying
  promise (7-day, wholly-unused, full KRW back). Whether that promise is still the right
  one for a donation rather than a purchase is an explicitly open question for counsel,
  not resolved here — see `docs/legal/terms-draft.md`'s 제8조 and new review-point 6.
- [x] **Why now**: legal research this session found Korea's 전자금융거래법 (amended 2024
  post-머지포인트 사태) and 전자상거래법's prepayment rules both attach real obligations
  to a straightforward "buy prepaid credit" model. Recasting mochi as a non-purchased
  donation bonus is a genuine attempt to move outside that regime — not certain to work,
  and explicitly flagged as unresolved rather than asserted as safe. Full reasoning in
  DECISIONS 2026-08-09 ("the donation pivot").
- [x] `test/mochi.test.ts`: 11 → 13 tests — the `buyMochi` describe block became
  `donateMochi` with 2 new cases (flooring an uneven donation; rejecting a below-rate
  donation), all 8+ fixture call sites across the other describe blocks converted from
  quantity-in to amount-in.
- [x] Verified: `check:vocab` clean on the reworded `donate`/`refund`/`creatorDashboard`
  namespaces (one substring false-positive caught — "후원금" contains the banned term
  "원금"; reworded rather than touching the checker); ko/en key parity holds. The schema
  rename, `pnpm test`, `tsc`, and `pnpm build` were verified the next day once this
  machine's dev environment was actually working — see 2026-08-10 above.

## 2026-08-09 (dropped the 60% unused-balance refund path)

- [x] **`/refund` now states two refund paths instead of three**: 주문 취소 (mochi back) and
  청약철회 (7-day, wholly-unused, KRW back), plus the 법령 carve-out. The 60% 미사용 잔액 환불
  path is gone — once any mochi from a purchase is spent, the rest just stays spendable in
  that creator's market, no cash path back. Prompted by asking whether purchases could be
  made non-refundable outright; the 7-day right survives because it tracks 전자상거래법 §17
  (already learned the hard way in 2026-08-01 → 2026-08-06 that a ToS clause can't just
  waive it), but the 60% rule was only ever a 신유형 상품권 표준약관 convention, not a floor —
  so it came out to narrow the refund surface as far as currently defensible.
- [x] Updated `messages/ko.json` / `en.json` (`refund` namespace: `balance` section removed,
  `intro` and the `withdrawal.note` reworded, remaining sections renumbered 1–5),
  `src/app/refund/page.tsx`'s `SECTIONS` array, `CLAUDE.md`, `README.md`, and
  `docs/legal/terms-draft.md`'s 제8조. `marketplace.disclosure` (the buy-flow copy) already
  only referenced the 7-day rule, so it needed no change.
- [x] Added lawyer-review drafts for `/terms` and `/privacy` at `docs/legal/terms-draft.md`
  and `docs/legal/privacy-draft.md` — not wired into the live pages, which still show the old
  placeholder pending counsel markup.
- [x] Verified: `check:vocab` clean, ko/en key parity holds (both locales dropped the same
  key). `tsc` and `pnpm build` not re-run this pass — copy-only change to an existing
  namespace, no types or routes touched.

## 2026-08-07 (after the stages: forfeiture, migrations, and a live prod drift)

- [x] **Unspent mochi is forfeited on account deletion, not returned to supply.** Reverses
  half of the earlier decision. The owner ruled out a refund, and "no refund" + "units go
  back on sale" cannot both hold — payment settles directly to the creator, so they would be
  paid for the mochi and then get to sell the same units again. The coherent no-refund shape
  is that the units stay sold. The confirmation dialog said the balance "returns to the
  creator's market supply"; that would have become a false statement to someone about to give
  up money, so it now says the balance is deleted and cannot be recovered. Recorded as the
  owner's call — see DECISIONS 2026-08-07.
- [x] **Prisma migrations adopted.** The build is now `prisma migrate deploy && next build`,
  with a `0_init` baseline. A failed migration fails the build and Vercel keeps the previous
  deployment, which is the point: a loud failure instead of silent drift.
- [x] **Found that the drift had already happened.** New `pnpm check:drift` (read-only)
  reports production against the repo: the six Phase-1 tables still present with ~900 rows,
  `RateLimit` and `Backer.pendingDeletionAt` missing, no `_prisma_migrations`. Production is
  three stages behind, and deploying as-is would 500 every authenticated page —
  `getCurrentBacker` selects a column prod doesn't have. **Not fixed here**: the fix drops
  ~900 rows from a live database, so it needs a backup and a human. Runbook in
  [`scripts/baseline-prod.md`](../../scripts/baseline-prod.md).
- [x] **Docs brought current.** PROGRESS rewritten as a real resume point (7KB); this file got
  the ten-stage entry below; DECISIONS gained seven entries with matching index rows; CLAUDE.md
  and README corrected (`messages/*.json` → `ko.json`, the suite is 24 tests not 11, lint exits
  0, `VERIFICATION_MOCK_MINOR` documented, and a line that predated the Studio-landing change).
- [x] Branch renamed `audit/stages-0-3` → `audit/product-hardening` — it had carried stages
  0–9 since Stage 4.

## 2026-08-07 (the audit: ten staged passes over the whole product)

A full read of `src/**` produced [`AUDIT-2026-08-06.md`](./AUDIT-2026-08-06.md) — findings
plus a ten-stage plan — and then the plan was executed stage by stage. One commit per stage,
each verified before the next started. Rationale for the load-bearing choices is in
DECISIONS 2026-08-07.

- [x] **Stage 0 — money safety.** `buyMochi` took an unbounded positive integer and the mock
  PG (still the production provider) succeeds unconditionally, so a crafted request could mint
  millions of mochi for free; large enough values overflowed the Int4 columns *after* the
  charge. Added `MOCHI_MAX_PURCHASE_QTY/KRW`, checked before the PG is called. Added
  `assertCanPurchase`: the live buy path never read `verifiedAt`/`ageVerified`/
  `guardianConsent` — only the dead `/back` flow did — while `/refund` promises minors a
  statutory carve-out. The mock verifier hardcoded `isAdult: true`, so the gate would have
  shipped untestable; it now derives age, and `VERIFICATION_MOCK_MINOR=1` produces a minor.
- [x] **Stage 1 — resilience.** No `error.tsx`, `global-error.tsx` or `not-found.tsx` existed
  anywhere: any throw showed Next's unstyled English crash page. Four boundaries over a shared
  `ErrorState`. `/s/[handle]` rendered "not found" at HTTP 200 — dead handles were indexable —
  now a real `notFound()`. Security headers (CSP **Report-Only**; enforcing needs a nonce), and
  the image proxy narrowed from `hostname: "**"`, an open SSRF vector that bought nothing since
  `next/image` is unused. Footer's `/dashboard` 404'd; all six `href="#"` links are gone.
- [x] **Stage 2 — UI primitives.** Seven files declared a byte-identical `inputClass` and six a
  byte-identical `labelClass`, already drifted. `Field`/`Input`/`Textarea`/`Select` and
  `InlineMessage`, migrated across all 10 files. Beyond dedup they carry the a11y wiring nothing
  had: `htmlFor`, `aria-describedby`, `aria-invalid`, `role="alert"` — **every form in the
  product previously announced nothing on submit** (WCAG 4.1.3). `Button` gained a real loading
  state; `SignupModal` dropped its duplicated portal/Escape/scroll-lock copy onto `ui/Modal`.
- [x] **Stage 3 — mobile + accessibility.** Below `lg` the Sidebar and RightRail don't render
  and the avatar menu is identity-only, so **on a phone the only route to `/explore` was a
  footer link**. Added `MobileTabBar` (94×56px targets). `ui/Modal` gained a focus trap and
  focus restore — Tab used to walk out into the dimmed page behind (2.1.2) and closing dropped
  focus to `<body>` (2.4.3). Skip link, one `main` landmark per page, `themeColor`/`viewportFit`.
  No horizontal scroll at 375–1440px.
- [x] **Stage 4 — SEO and share cards.** The app had **one** `metadata` export and it still sold
  the retired Trust Report, so every page shared one wrong title with no OG tags. Root metadata,
  `generateMetadata` on seven public routes, `noindex` on every signed-in surface, `robots.ts`,
  `sitemap.ts` (static + every approved creator), `manifest.ts`, and a per-creator OG image.
  The card needed a Noto Sans KR subset fetched per render — Satori ships Latin only, so every
  real creator 500'd until then (58KB subset vs 6.1MB full face).
- [x] **Stage 5 — buyer cancellation.** Spending was the fastest and least reversible action in
  the product: two taps, cost shown nowhere between, and only the *creator* could cancel.
  `cancelOrderByBuyer` mirrors the creator path exactly. Closed a pre-existing **double-refund
  race** while in reach: `cancelOrder` read-then-checked `status`, so two cancels racing could
  each credit the balance. Also: Explore search silently dropped every other filter; marketplace
  items rendered their price twice.
- [x] **Stage 6 — performance.** Measured with Prisma query logging, same method before and
  after: `/home` **44 → 22**, `/explore` 19 → 9, `/s/creatorA` **50 → 19**, `/profile` 25 → 11.
  Largest cause wasn't in the audit at all — `auth()` isn't deduplicated, and its `jwt` callback
  queries Backer and Streamer on every call (five times on a creator page). Plus: `getFollowList`
  ran twice per page, `/s/[handle]` fetched its profile and leaderboard twice, both N+1s removed,
  three unbounded queries bounded, and the discovery rail cached across requests.
- [x] **Stage 7 — deletion, export, rate limiting.** `/settings` had no way to leave. Account
  deletion is now a **30-day grace period** (owner decision) — signing back in cancels it,
  requesting it revokes the session, and a Vercel cron runs an idempotent purge. Creator accounts
  are refused outright: deleting a `Streamer` cascades to every holder's balance. Data export for
  PIPA. Rate limiting where there was none, on Postgres counters rather than a hosted dependency.
- [x] **Stage 8 — debt.** 954 LOC of dead code deleted (the `/back` subtree was a closed island),
  the Phase-1 schema dropped now that the Trust Report retirement is confirmed permanent,
  `en.json` deleted (Korean-only at launch), and **`pnpm lint` exits 0 for the first time** — three
  real fixes, no suppressions. Also killed a fabricated homepage stat (`backerCount * 10` shown as
  a creator's real mochi total).
- [x] **Stage 9 — creator updates.** `Update` has existed since Phase 1 and **nothing could ever
  write one**, so every 소식 came from the seed. Studio composer, `new_update` notification, and
  backers-only posts now unlock for people who actually bought mochi (they were locked for
  everyone, including the audience they were written for).
- [x] Verified per stage: `pnpm build`, `pnpm test` (24, up from 11), `check:vocab`,
  `check:emoji`, and `pnpm lint` — which finished at **exit 0**. Money-logic changes were
  verified against the database, and UI changes in a real browser.

## 2026-08-06 (the 환불·청약철회 policy page is real)

- [x] **New `/refund`** — the placeholder that PROGRESS had flagged as the project's one
  liability-grade gap. States three separated refund paths: 주문 취소 (mochi restored, already
  built), 청약철회 (7 days, wholly-unused purchase, KRW), 미사용 잔액 (60% spent → remainder
  at price paid, KRW), plus the 법령 carve-out and the 양도·재판매 prohibition. Copy in both
  locales, 21 keys, no hardcoded strings.
- [x] **Fixed the contradiction at the point of payment**: `marketplace.disclosure` still
  promised a flat no-refund with law-only exceptions, which the new policy contradicts. It
  now summarises the 7-day rule and links to `/refund`.
- [x] **Wired three dead footer links** — 이용약관/개인정보처리방침/환불·청약철회 had pointed at
  `#` since Phase 1. `/refund` added to `ONBOARDING_ALLOW` so the gate doesn't bounce it.
- [x] **The positions are the owner's, not counsel's** — sign-off is now the gate on
  `PAYMENT_PROVIDER` leaving `mock`, and termination-of-service is a deliberate omission.
  Both carried as open items. See DECISIONS 2026-08-06.
- [x] Verified: `tsc` clean, `check:vocab` clean (contextual "return" warnings only — the
  English word for returning money), `check:emoji` clean, eslint unchanged (same 2
  pre-existing errors), `pnpm build` clean (**26 routes**, `/refund` new), ko/en key parity
  confirmed at 0 drift. **`pnpm test` not run** — Docker daemon down, and this change
  touches no money logic (`src/lib/mochi.ts` untouched).

## 2026-08-03 (studio→apex hops go straight to the canonical host)

- [x] **Cross-host redirects are one hop, not two.** Vercel serves the consumer app on **www**
  and 308s the bare apex to it, so stripping `studio.` off the request host landed on a
  redirect rather than the page: `studio.themotoo.com/explore` → `themotoo.com/explore`
  (307) → `www.themotoo.com/explore` (308). `src/proxy.ts` now normalizes the apex to
  `PROD_CANONICAL_APEX`. Verified live: **hops=1** on every consumer path.
- [x] **Investigated first, and it was a non-issue**: consumer pages *appear* to exist on the
  studio host in dev (`studio.localhost:3001/explore`). Production has always 307'd them to
  the apex — checked live for `/explore`, `/home`, `/profile`, `/login`, `/s/[handle]`. The
  dev behaviour is the documented carve-out, and it's still required: removing it and
  re-testing produced a relative `Location: /explore`, i.e. an infinite same-host loop,
  because Next's dev server flattens any absolute Location matching its own binding.
  `isStudioPage`'s allowlist also still matches the built Studio routes exactly.
- [x] Verified: host math checked for all six host shapes (prod apex/www/studio, dev
  apex/studio, Vercel preview), dev carve-out re-confirmed loop-free, `tsc`, `check:vocab`,
  `check:emoji` clean, eslint unchanged, `pnpm test` 11/11, `pnpm build` clean, and the
  production chain re-measured after deploy.

## 2026-08-02 (login/signup navigate for real, so the onboarding gate runs)

- [x] **Closed the open item from the logout investigation.** A non-onboarded user landed on
  `/` after login instead of `/onboarding`, and a brand-new signup landed on `/home`. A
  network trace showed the action's `303 → /;push` was followed by **no request for `/` at
  all** — Next resolved the destination in the action and finished with a soft transition, so
  the middleware gate never ran. `revalidatePath` doesn't help; the request isn't cached, it
  isn't made.
- [x] **`loginAction` / `signupUser` now return `{ ok: true }`** and the forms do
  `window.location.assign("/")`. Failure paths still return inline errors rather than
  navigating.
- [x] Verified all four destinations: onboarded fan → `/home`, creator → the Studio
  subdomain, non-onboarded → `/onboarding`, brand-new signup → `/onboarding`. Bad password
  and duplicate email still show their inline error and stay put. Re-ran the logout leak
  harness after the change: **0/8**. `tsc`, `check:vocab`, `check:emoji` clean, eslint
  unchanged, `pnpm test` 11/11, `pnpm build` clean. Test accounts removed from the dev DB.

## 2026-08-02 (collapsing a rail no longer moves the footer)

- [x] **`min-h-[calc(100vh-64px)]` on the ConsumerShell row.** A collapsed rail is a
  fixed-height strip (it must be, or its divider stops short — DECISIONS 2026-07-31) while an
  expanded one is content-sized, so on short pages the collapsed strip became the tallest
  item in the row and dragged the footer down: measured **176px** on `/ranking`, 22px on
  `/notifications`, 0px on `/profile` (its content already exceeded the height, which is why
  it looked intermittent).
- [x] Verified: 0px footer movement across all four rail combinations on `/home`, `/explore`,
  `/ranking`, `/notifications`, `/profile`, `/settings`, screenshots checked both states.
  `/s/[handle]` still shifts 20px **upward** — genuine content reflow at a wider column, not
  the bug. `tsc`, `check:vocab`, `check:emoji` clean, eslint unchanged, `pnpm test` 11/11,
  `pnpm build` clean.

## 2026-08-02 (logout actually revokes the session)

- [x] **Fixed a real auth bug**: logging out didn't end the session. Reproduced 3/8 logouts —
  a request still carrying the old cookie (in-flight RSC fetch / prefetch) landing after the
  sign-out got a valid session back, and Auth.js re-issues the session cookie on every
  authenticated request, so the browser was silently signed back in. A token replayed after
  logout also still worked, for its full 30-day life.
- [x] **`Backer.tokenVersion` (new column)** — logout increments it, the `jwt` callback
  rejects stale tokens. A counter rather than an issued-at cutoff, so there's no same-second
  race between logging out and back in. Costs one indexed SELECT per authenticated request.
  **Deploying this logs everyone out once** (existing tokens carry no version) — intended.
- [x] **Logout is now a native POST to `/api/logout`**, not a server action, so the browser
  does a real navigation and cancels the old document's in-flight fetches.
- [x] Verified: replayed token now 307s / renders signed-out and the cookie the server still
  writes is inert; **0 leaks in 14** login→immediate-logout→회원가입 cycles (0 login
  failures); onboarding gate, `completeOnboarding` and `createStudio` (both
  `unstable_update` paths) still work. `tsc`, `check:vocab`, `check:emoji` clean, eslint
  unchanged, `pnpm test` 11/11, `pnpm build` clean. Dev DB restored after testing.
- [ ] **Known, pre-existing, not fixed**: right after login a non-onboarded user lands on `/`
  instead of `/onboarding`. The gate itself works (any later navigation redirects; curl shows
  `/` → 307 → `/onboarding`) — it's the client transition straight after the login action.
  Confirmed pre-existing by stashing the fix. See DECISIONS 2026-08-02.

## 2026-08-02 (Studio pill gate + creator-setup heading)

- [x] **A fan clicking 스튜디오 now gets an explanation, not a form.** New `StudioPill`
  client component: a creator keeps a direct `<Link href="/studio">`, a fan gets a modal
  saying they aren't registered as a creator, with 크리에이터 등록하기 / 나중에 하기.
  Scoped to this pill — the explicitly-labelled creator CTAs still go straight through.
- [x] **New shared `ui/Modal`** (portal + Escape + backdrop + ✕). The portal is required, not
  stylistic — the nav's `backdrop-blur` would otherwise trap a `fixed` overlay.
  `SignupModal` predates it and was left as-is.
- [x] **Creator-setup heading hierarchy un-inverted** — 크리에이터 시작하기 is now the H1 and
  나만의 모찌 마켓을 열어보세요 the supporting line (was the other way round). Message keys
  renamed to match (`eyebrow` dropped, new `tagline`).
- [x] Verified: `tsc`, `check:vocab`, `check:emoji` clean, eslint unchanged, `pnpm test`
  11/11, `pnpm build` clean. Browser-checked as both account types: the fan's pill opens the
  modal without navigating, Escape / 나중에 하기 / ✕ all dismiss it, 크리에이터 등록하기
  reaches `/creator/onboarding`, the creator's pill is still a plain link, no page errors.

## 2026-08-01 (creator status badge)

- [x] **`크리에이터 등록 완료`** — new shared `CreatorBadge`, shown in the nav's avatar
  dropdown and on `/profile` for accounts that own a Studio. Additive accounts meant nothing
  on either surface said you were a creator. Keyed off `session.user.creator` (already in the
  JWT), copy in `common`. See DECISIONS 2026-08-01.
- [x] Verified: `tsc`, `check:vocab`, `check:emoji` clean, eslint unchanged, `pnpm test`
  11/11, `pnpm build` clean. Browser-checked both account types — the creator gets the badge
  in both places, the fan gets it in neither, no page errors.

## 2026-08-01 (uploads, non-refundable mochi, creator-page layout, Studio landing)

- [x] **User-uploaded images**, stored as small JPEG **data URLs in Postgres** (no object
  storage in this project — see DECISIONS 2026-08-01). New `src/lib/imageUpload.ts`
  (budgets + `parseImageDataUrl` server gate) and `src/components/ui/ImagePicker.tsx`
  (client-side center-crop + quality-stepped re-encode), shared by both surfaces:
  - **Profile picture** (`/settings` → 프로필 사진, `Backer.avatarUrl`) — renders in the nav,
    `/profile`, and the supporter leaderboard. Read via a one-column query, **not** the JWT.
  - **Marketplace item cover photo** (`MarketplaceItem.coverImage`, new column) — set in the
    Studio item form; a cover replaces the curated thumbnail tile on both the Studio card and
    the fan-facing market card.
- [x] **Mochi is non-refundable by default** — `marketplace.disclosure` rewritten (both
  locales), constraint updated in `CLAUDE.md`/`README.md`. Legally-compelled exceptions only
  (a minor's payment). See DECISIONS for the 전자상거래법 §17 caveat still open on the policy page.
- [x] **`/s/[handle]` fills its column and boxes its sections** — dropped the 900px cap on
  this page and wrapped 후원자 랭킹 / 마켓 / 소식 in bordered panels (inner rows → `bg-panel`).
  A scoped exception to the "one content width / bare sections" rules, not a reversal.
- [x] **Creators land in the Studio** — `/` routes `session.user.creator` to `/studio`, fans
  to `/home`. `/home` stays reachable; accounts are still additive.
- [x] **`motoo studio` wordmark** on the Studio host (`BrandLogo studio` prop).
- [x] **`나중에 하기`** on creator setup → `/home`.
- [x] **Fixed while verifying**: Korean item titles wrapped mid-word (실시간 샤/라웃) once the
  market moved inside a boxed section and the cards narrowed. Added `break-keep`
  (`word-break: keep-all`, the correct CJK rule) to both item-card titles.
- [x] Verified: `tsc`, `check:vocab`, `check:emoji` clean, eslint unchanged (same 2
  pre-existing errors), `pnpm test` 11/11, `pnpm build` clean (25 routes), `prisma db push`
  applied. The image gate was unit-checked directly: valid JPEG passes; remote URL,
  `text/html`, `image/svg+xml`, and oversized payloads all rejected.
- [x] **Browser-verified with headless Chromium** (Playwright driving the real dev server,
  logged in as both the seeded fan and the seeded creator, screenshots reviewed at 1440 and
  1920):
  - Uploaded a real PNG through `ImagePicker` on `/settings` — the browser-side crop/encode
    ran, the circular preview appeared, 저장 persisted it, and the **nav avatar updated in
    place** (no navigation) via `router.refresh()`. Confirmed again in reverse by clearing it.
  - The avatar then rendered in the nav, `/profile`, and the supporter leaderboard.
  - Uploaded a cover in the Studio item form, saved, and confirmed the photo renders
    full-bleed 16:9 with the thumbnail tile correctly suppressed — on both the Studio card
    and the fan-facing market card.
  - `/s/creatorA` fills the middle column at 1920 (the 900px cap only ever bound above
    ~1500px) with all three sections boxed; `motoo studio` on the studio host vs plain
    `motoo` on the consumer host; fan login → `/home` vs creator login → studio subdomain;
    the new non-refundable disclosure and the 나중에 하기 button both render; the 50만원
    preset comes up selected with its 추천 badge.
  - No page errors. One **pre-existing** console warning on the creator's cross-host hop:
    Next's RSC prefetch to `/studio` is blocked by CORS (different origin) and falls back to
    a full browser navigation, which succeeds. Same mechanism as clicking the Studio pill —
    the #12 change just puts it on the login path too.
  - Dev DB left clean afterwards (0 avatars, 0 covers, test item deleted).

## 2026-08-01 (signup-flow fixes + 백커 → 팬)

- [x] **Fan signup no longer ends in creator onboarding.** The `creatorIntent` cookie set
  by `/api/become-creator` lives 7 days and nothing cleared it, so a 후원자 signup made
  after any creator-CTA click was still routed to `/creator/onboarding`. New
  **`/api/fan-signup`** (mirror of `/api/become-creator`) clears it; every 후원자 entry
  point goes through it. See DECISIONS 2026-08-01.
- [x] **Post-onboarding lands on `/home`**, not `/` (which only bounced there anyway). The
  reported "back to the signup page" was the stale-intent detour above falling through
  `/creator/onboarding` → `/api/become-creator` → `/signup`.
- [x] **50만원 is the recommended mochi issuance** — `MOCHI_RECOMMENDED_PRESET` is selected
  by default on a fresh Studio setup (was 10만원) and badged 추천 with a coral outline.
- [x] **`/home`'s "모찌는 이렇게 쓰여요" steps are clickable** — all three link to
  `/explore` (the only place any of them can start with zero holdings), with a hover state
  and an arrow so they read as entry points.
- [x] **백커 → 팬 everywhere** in `messages/*.json` + `prisma/seed.ts`, and **build-gated**:
  `pnpm check:vocab` gained a `RETIRED` list that now fails on 백커.
- [x] Verified: `tsc`, `check:vocab`, `check:emoji` clean, eslint unchanged (same 2
  pre-existing errors before/after), `pnpm test` 11/11, `pnpm build` clean (25 routes,
  `/api/fan-signup` new). Live-server checked: `/api/fan-signup` 307s to `/signup` with an
  expiring `creatorIntent` (become-creator still sets it), creator onboarding renders 50만원
  `aria-pressed="true"` + the 추천 badge, the zero-holdings `/home` primer renders three
  `<a href="/explore">` steps, `/explore` renders 팬 수/팬 수순 with zero 백커, and both
  landing CTAs point at `/api/fan-signup`.

## 2026-08-01 (Studio nav: added a "motoo" pill back to the consumer app)

- [x] **Studio host's nav now has a `backToMotoo` pill**, same style/position as the
  consumer nav's Studio pill, mirrored the other direction — one click from
  `studio.themotoo.com` back to `/home` on the apex. Both hosts share one `Nav` component;
  no separate Studio nav to maintain. Ranking/notification icons deliberately not added to
  the Studio side — those are consumer-only concepts (creators don't receive
  notifications). See DECISIONS 2026-08-01.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean, browser-tested on `studio.localhost` (pill renders, click reaches
  `/home` content) and confirmed the real consumer host's nav is unaffected.

## 2026-08-01 (Trust Report removed — not part of 1.0.0)

- [x] **Trust Report is fully gone from the website**: `GradeBadge`, `SampleReport.tsx`,
  `/s/[handle]/report` deleted; `getExploreStreamers`/`StreamerCard` no longer read the
  `reports` relation (`backerCount` is now a live `MochiHolding` count, sort narrowed to
  backers/newest); `getStreamerProfile` dropped its report metrics (profile headline stats
  now show 후원자/총 모찌, both live via `getSupporterLeaderboard`'s new `totalMochiPurchased`
  aggregate).
- [x] **`/creators` landing page rewritten** — its whole pitch was "prove fandom to
  sponsors via a Trust Report"; rewrote hero/insight/how-it-works/features/testimonial
  around the real 1.0.0 product (issue mochi, own market, direct payment). Hero visual is
  now a marketplace-item preview card instead of a sample report mockup.
  See DECISIONS 2026-08-01.
- [x] Also fixed two stale "백커 월/파운딩 배지" (old Backer Wall) mentions on the fan
  landing page, found while auditing — same class of bug as the Trust Report sweep, left
  over from the earlier Backer Wall → ranking migration.
- [x] `src/lib/grades.ts` left in place but fully dormant (zero remaining imports) — same
  "schema kept" precedent as the rest of the shelved thesis. Legacy `/s/[handle]/back` flow
  also untouched (already orphaned, out of scope).
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes, `/s/[handle]/report` gone), browser-tested `/`, `/explore`,
  `/creators`, and a creator profile page end to end.

## 2026-08-01 (Buy Mochi → own page; Backer Wall → real supporter ranking)

- [x] **`/s/[handle]/buy`** (new): 모찌 보내기 now routes to a focused standalone page
  instead of an in-page anchor. `BuyMochi` itself unchanged — just re-wrapped. Both
  buy/redeem actions revalidate the new path too.
- [x] **Backer Wall deleted** — it was Phase-1 Kickstarter-era plumbing (founding numbers,
  the legacy `Backing` model), disconnected from the mochi model. Replaced with a real
  supporter leaderboard (`getSupporterLeaderboard` in `src/lib/ranking.ts` +
  `SupporterLeaderboard.tsx`), ranked live by lifetime mochi purchased — same pattern as
  the existing per-backer `getSupporterRank`. Headline "supporters" stat now counts real
  `MochiHolding` rows instead of the legacy backing count.
- [x] **"백커" replaced with 후원자** on this page's copy (headline stat, leaderboard,
  updates lock label) — never an agreed term, leftover from the same retired thesis.
- [x] **Ranking (30%) + Marketplace (70%) side by side**, replacing the Backer Wall's old
  full-width slot; stacks to one column on narrow viewports. See DECISIONS 2026-08-01.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (24 routes, `/s/[handle]/buy` new), browser-tested the full purchase
  flow end-to-end on the new page (balance + goal progress + leaderboard all updated live).

## 2026-07-31 (unified page width + heading style across the app)

- [x] **One content width for every page**: `/home`, `/explore`, `/ranking`,
  `/notifications`, `/profile`, and `/s/[handle]` all now share `max-w-[900px] px-6 py-12
  sm:px-10 sm:py-16` and the same H1 style (`text-[28px]/sm:text-[34px]`) — previously
  ranged 640–1200px with three different H1 sizes. `/explore` dropped its one-off `Eyebrow`
  label and moved its card grid to `lg:grid-cols-3` (from 4) to suit the narrower column.
  `/settings` is the one intentional exception, kept narrower since it's a form, not a
  content feed. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked all six pages line up at the same left
  edge and title size.

## 2026-07-31 (fixed collapsed-rail border line stopping short)

- [x] **Collapsed rail's border line was cut short**: the collapsed strip used
  `max-h-[calc(100vh-64px)]` (a cap) with no matching `h-` (a floor), so its box height was
  driven by its one-button content (~80px), not the full sticky column — the border line
  could only run alongside those ~80px, leaving the rest of the viewport with no divider
  below the reopen arrow. Fixed in both `RightRailPanel` and `SidebarPanel`: swapped
  `max-h-[calc(100vh-64px)] overflow-y-auto` for a fixed `h-[calc(100vh-64px)]`. See
  DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), full-viewport screenshot confirmed both borders now run
  the complete height when collapsed.

## 2026-07-31 (both rails are now foldable, state persists)

- [x] **Sidebar and RightRail are both collapsible**: hover reveals a fold button before
  the section header (새로운 크리에이터 / 팔로잉), which grows in and pushes the header
  right; clicking it shrinks the whole rail to a thin strip with just a reopen chevron on
  its own edge. State persists across navigation via a new shared hook,
  `usePersistedCollapse` (`useSyncExternalStore` + `localStorage`, not a mount effect —
  avoids the `set-state-in-effect` lint rule).
- [x] Each rail split into a server half (data fetch: `Sidebar`/`RightRail`) and a client
  half (interaction: new `SidebarPanel`/`RightRailPanel`) — `SidebarNavLinks.tsx` folded
  into `SidebarPanel` and removed. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked hover-reveal, collapse, reopen, and
  persistence across a page navigation on both rails.

## 2026-07-31 (fixed invisible nav hover/active box)

- [x] **`bg-panel` was invisible against the page**: `--color-panel` is the exact same hex
  as `--color-cream` (page background), so every nav hover/active box (Sidebar links,
  following-list rows, Nav's ranking icon, NotificationBell) rendered with zero contrast.
  Switched those specifically to `bg-cream-warm` (already used this way by `UserMenu`'s
  dropdown rows) — left the `panel` token itself alone since ~20 other places rely on it
  matching the page background on purpose (inset panels on white cards). See DECISIONS
  2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked the hover box now visibly appears.

## 2026-07-31 (compass icon fix + Sidebar active-page state)

- [x] **`IconCompass` fixed for real**: the needle path was asymmetric about the circle's
  center (not just small), causing one tip to nearly touch the circle edge. Replaced with
  properly-centered coordinates, verified by rendering it standalone at 200px.
- [x] **Sidebar nav shows the active page**: 홈/둘러보기 now highlight (accent color +
  panel background) when you're on that page, via a new client component
  (`SidebarNavLinks.tsx`) using `usePathname()`. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked both active states on `/home`/`/explore`.

## 2026-07-31 (RightRail: two-up grid + instant Follow)

- [x] **`RightRail` redesigned**: `grid-cols-2` (was single column), thumbnails shrunk
  90px tall (was 140px), and a compact `FollowButton` added under each card so a fan can
  follow a discovered creator without leaving the rail. `StreamerCard` gained an `id`
  field (needed by `toggleFollow`); `FollowButton` gained a `compact` size variant.
  `toggleFollow`'s revalidation widened to every ConsumerShell page, not just
  `/s/[handle]` and `/home`. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked the new grid + follow buttons.

## 2026-07-31 (nav icon sizing + `IconStudio` redraw)

- [x] **Enlarged nav/sidebar icons** and **redrew `IconStudio`** (was a genuine rendering
  bug — malformed disconnected "flap" path, play-triangle collapsed to a round blob under
  the shared stroke style — not just too small). Nav ranking/bell buttons `h-9 w-9`→
  `h-10 w-10` (icons `19→23`), Studio pill icon `16→20`, notification badge enlarged and
  repositioned, Sidebar `IconHome`/`IconCompass` `18→22`. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (25 routes), zoomed before/after screenshots confirmed the fix.

## 2026-07-31 (true edge alignment + universal rail, no exceptions)

- [x] **Fixed a real layout bug**: the 3-column shell was centered inside `max-w-[1600px]`,
  so on wide screens both rails sat at the edge of that centered block, not the true browser
  edge. Dropped the cap on `ConsumerShell` and `Nav` (`w-full` instead of `mx-auto max-w-…`)
  so the sidebars and the nav logo/icons all sit flush to the real viewport edge.
- [x] **Column separators**: `RightRail` gained `border-l` (matching Sidebar's `border-r`) so
  the three columns read as visually distinct panels.
- [x] **`/s/[handle]`'s rail exception is gone** — reversed after the owner re-confirmed "no
  matter what" a second time. That page's own two-column grid (marketplace/wall left,
  Buy Mochi/Report/Updates right) collapsed into one column (Buy Mochi first, then
  marketplace → trust report → backer wall → updates), freeing the right slot for the now-
  truly-universal `RightRail`. `RightRail` also stopped collapsing to nothing when it has no
  suggestions — always shows its shell with an empty-state line instead.
  See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked at 1920px — true edge alignment confirmed,
  identical rail content on every page including the creator profile.

- [x] **New `RightRail`** (discovery suggestions) promoted out of `/home` into
  `ConsumerShell`, alongside the left `Sidebar` — both now render on every wrapped page
  (`/home`, `/explore`, `/ranking`, `/notifications`, `/profile`, `/settings`) with
  identical content regardless of which page you're on. **Both rails are `sticky`** (stay
  pinned while the middle column scrolls, not just present across navigation).
  **Exception**: off on a creator's public `/s/[handle]`, which keeps its own existing right
  column (Buy Mochi/Trust Report/News) — confirmed with the owner rather than assumed, since
  the alternative (folding that column into the page) was a real, much bigger option.
  `HomeSignedIn` dropped its own discover column now that it's redundant. See
  DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked all pages — same rail content on
  home/profile/settings, no rail on the creator profile.

## 2026-07-31 (Spotify-referenced sections, corrected to bare · local only, not yet deployed)

- [x] **Sections are bare, not boxed** — a first pass wrongly generalized Spotify's sidebar
  *widget* CSS into a whole-section panel; a real logged-in screenshot (owner-provided) showed
  Spotify's actual content shelves have no box at all, just a heading + a row of individually-
  shaped item cards. `src/components/ui/Section.tsx` now defaults to bare (`boxed` prop,
  default off); `/home`/`/profile`/`/ranking` stayed bare, `/settings` opted back into
  `boxed` deliberately (it's a form group, not a content shelf). Palette untouched throughout.
  See DECISIONS 2026-07-31.
- [x] **Second pass, same session**: item-level cards still had `border-line-2` everywhere,
  so it still read as boxed even with the section wrapper gone. Fixed against the real
  screenshot: compact rows (holdings/affordable/pending/news/history/ranking) dropped the
  border for a flat `bg-card` fill + `shadow-soft`; the discover cards on `/home` dropped the
  card treatment entirely — bare rounded image (`CreatorCover`'s own radius + clip), caption
  below on the page background.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked all four pages against the real reference.

## 2026-07-30 (full nav restructure: Sidebar, Ranking, Profile, Settings · local only, not yet deployed)

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

## 2026-07-30 (notifications + follow list + home widened · local only, not yet deployed)

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

## 2026-07-29 (signed-in home + design de-slopping · local only, not yet deployed)

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

## 2026-07-24 (unified navbar + signup role modal + landing/design polish · deployed live)

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

## 2026-07-24 (Studio split onto studio.themotoo.com)

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

## 2026-07-20 (Studio dashboard redesign + creator settings · deployed live)

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

## 2026-07-19 (marketplace items: suggestions + thumbnails + fulfillment · Supabase live)

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

## 2026-07-15 (creator taxonomy + mochi economics + Studio UX)

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

---

# Phase history

The original phase plan, all built and verified. Kept for provenance; the live system is
described in [`../CLAUDE.md`](../CLAUDE.md) and [`PROGRESS.md`](./PROGRESS.md).

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
soft goal**, non-transferable, no resale/return. Refund wording here has moved twice —
originally "unspent-refundable", flat non-refundable at 2026-08-01, then narrowed to the
shipped policy at **2026-08-06**. `/refund` is the current source of truth; do not quote
this line for it.

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

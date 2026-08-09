# motoo — Decision Log

Why the project is the way it is. Newest first. Keep entries short: decision,
rationale, and any constraint it creates. **Adding an entry? Add its row to the index too.**

## Index

Every decision, newest first. **Read the one entry you need, not this file** — it is ~87KB.
To pull a single entry, grep its heading with trailing context, e.g.
`rg -A 40 '^## 2026-08-02 — Logout' docs/DECISIONS.md`.

| Date | Decision |
| --- | --- |
| 2026-08-10 | Code pushed to `main` before the prod schema — owner's informed call (rename later converted to a migration on merge) |
| 2026-08-10 | Design-tier-2/3 pass + de-boxing the landing's repeated cards (owner's call) |
| 2026-08-10 | 고객센터 wired to the owner's personal email, explicitly as an interim channel |
| 2026-08-09 | Mochi becomes a donation bonus, not a purchase (the donation pivot) |
| 2026-08-09 | Dropped the 60% unused-balance refund path; 7-day 청약철회 stays |
| 2026-08-07 | Schema changes go through migrations, and prod had already drifted |
| 2026-08-07 | Account deletion: 30-day grace, and unspent mochi is forfeited |
| 2026-08-07 | Rate limiting lives in Postgres, not Redis, and fails open |
| 2026-08-07 | The Trust Report schema is dropped, not dormant; `Update` survives |
| 2026-08-07 | Korean only: `en.json` deleted rather than maintained for nobody |
| 2026-08-07 | Mobile gets a bottom tab bar, not a hamburger |
| 2026-08-07 | Purchase ceilings are per-transaction, and the age gate lives in `mochi.ts` |
| 2026-08-07 | CSP ships Report-Only; HSTS ships without `preload` |
| 2026-08-06 | `/refund` states real positions: 7-day 청약철회, 60% rule, 법령 carve-out |
| 2026-08-03 | Cross-host hops target the canonical host, not the bare apex |
| 2026-08-02 | Auth transitions navigate for real; a server-action redirect skipped middleware |
| 2026-08-02 | The shell has a height floor, so collapsing a rail can't move the footer |
| 2026-08-02 | Logout actually revokes the session (`Backer.tokenVersion`) |
| 2026-08-02 | The Studio pill asks before it enrolls; creator-setup heading un-inverted |
| 2026-08-01 | Creator status is shown, not inferred (`크리에이터 등록 완료`) |
| 2026-08-01 | Mochi is non-refundable; user-uploaded images; creators land in the Studio |
| 2026-08-01 | Fan signup no longer inherits creator intent; 백커 retired for 팬 |
| 2026-08-01 | Studio nav gets its own "motoo" pill back to the consumer app |
| 2026-08-01 | Trust Report removed from the website; not part of 1.0.0 |
| 2026-08-01 | Buy Mochi moves to its own page; Backer Wall becomes a real ranking |
| 2026-07-31 | One content width and heading style for every ConsumerShell page |
| 2026-07-31 | Collapsed rail's border line was stopping short, right below the arrow |
| 2026-07-31 | Both rails are foldable, persisted, same mechanic mirrored |
| 2026-07-31 | `bg-panel` is literally the same color as the page background |
| 2026-07-31 | `IconCompass` was genuinely lopsided; Sidebar nav gets an active state |
| 2026-07-31 | RightRail: two-up grid, smaller thumbnails, instant Follow |
| 2026-07-31 | Nav/sidebar icons enlarged; `IconStudio` redrawn (was broken) |
| 2026-07-31 | Rails pinned to the true viewport edge; rail is now universal, no exception |
| 2026-07-31 | Three independent columns; only the middle changes per page |
| 2026-07-31 | Sections are bare, not boxed (Spotify-referenced, corrected) |
| 2026-07-30 | Full nav restructure: persistent Sidebar, Ranking, Profile, Settings |
| 2026-07-30 | Notifications + Follow: the home rail merges paid and free support |
| 2026-07-29 | The home's left rail is a *content* rail, and the fix was mostly data |
| 2026-07-29 | The app home is `/home`; `/` stays the marketing landing |
| 2026-07-29 | No emoji in the UI, anywhere (build-gated) |
| 2026-07-29 | Creator cover art is generated, not uploaded |
| 2026-07-24 | Unified navbar + avatar dropdown (one bar everywhere) |
| 2026-07-24 | Signup role modal; login stays unified |
| 2026-07-24 | Landing funnels to signup, not browse |
| 2026-07-24 | Design language: line icons over emoji, circles over floating mochis |
| 2026-07-24 | Studio on its own subdomain (studio.themotoo.com) |
| 2026-07-20 | Studio settings entry lives in content, not the navbar |
| 2026-07-20 | Section guidance as info tooltips, not inline subtitles |
| 2026-07-20 | Single-view Studio dashboard (no sidebar) |
| 2026-07-19 | Marketplace item fulfillment modes (instant vs request) |
| 2026-07-19 | Item thumbnails are curated + code-defined, not uploads |
| 2026-07-19 | Suggested items keyed on creator type |
| 2026-07-14 | Mochi issuance: ratcheting price tiers (prepaid credit, not a security) |
| 2026-07-15 | Creator taxonomy: type (primary) → category (dependent) |
| 2026-07-12 | Additive creator model (user base + Studio) |
| 2026-07-11 | Role-aware home; marketing demoted, not deleted |
| 2026-07-11 | Fan onboarding + identity verification as an abstraction |
| 2026-07-11 | Auth split for edge middleware + self-healing sessions |
| 2026-07-10 | Phase 3 follow-ups: order history, self-signup, tests |
| 2026-07-10 | Phase 2 build: retire backing, per-creator holdings, creator auth |
| 2026-07-09 | Pivot to the mochi-marketplace model |
| 2026-07-09 | Mochi supply = "capped as a soft goal" |
| 2026-07-09 | Marketplace items are guidelines; fulfillment off-platform in v1 |
| 2026-07-09 | Database: Supabase Pro (Seoul), not Neon |
| 2026-07-09 | Hosting: Vercel; pipeline-first sequencing |
| 2026-07-08 | Two separate landing pages |
| 2026-07-08 | `FoundingMembership` table for the founding-number invariant |
| 2026-07-08 | Prisma pinned to v6 (not v7) |
| 2026-07-08 | Korean-first, i18n-ready; integer KRW; mock PG |

## 2026-08-10 — Code pushed to `main` before the prod schema, owner's informed call
> **The outage half of this entry was resolved by the merge into
> `audit/product-hardening` the same day.** That branch had already moved schema changes
> onto Prisma migrations applied by the Vercel build (2026-08-07 entry below), so the
> rename was committed as `prisma/migrations/20260810020000_donation_pivot_rename` —
> three `ALTER TABLE … RENAME COLUMN`s, which *preserve* the lifetime totals a
> drop-and-recreate would have lost. No manual `--accept-data-loss` push is needed, and
> prod picks the rename up with every other migration once it is baselined (that baseline
> is still the gate on deploying the branch at all). The reasoning below stands as the
> record of the call that was made at the time.

Asked to "update md files and push." Checking the deploy runbook first surfaced a real
problem: the donation-pivot rename (previous entry) is a **destructive** schema change —
first one this project has shipped; everything before it was additive/nullable and safe
by Prisma's own default refusal-without-`--accept-data-loss` behavior. The Vercel build
only runs `prisma generate`, never `db push` (DEPLOYMENT.md, standing constraint) — prod
schema pushes are a manual pre-push step, and this one needs real Supabase credentials
that don't exist on this machine (`.env.production.local` absent).

- **Put the choice to the owner rather than deciding silently**: push code + prod schema
  together (owner does the prod push, which only they can — real credentials), hold the
  push entirely until sorted, or push code now and accept the outage. **Owner picked the
  third**, explicitly, understanding themotoo.com's mochi-related pages (buy/donate,
  leaderboards, ranking, Studio dashboard) will 500 until someone with prod credentials
  runs the `--accept-data-loss` push documented in DEPLOYMENT.md.
- **Flagged at the top of PROGRESS.md**, not buried — "nothing is half-finished, main is
  green" was true before this and is not true now, so the file's own framing changed to
  say so rather than let a stale "all green" line sit above a real outage.
- Not a mistake to walk back: this is the direct, foreseeable consequence of the same
  destructive-rename design decided in the donation-pivot entry, now actually shipped.
  The fix is one command away once someone has prod credentials — see DEPLOYMENT.md.

## 2026-08-10 — Design-tier-2/3 pass, plus de-boxing the landing's repeated cards
PROGRESS.md's design-tier-2/3 bucket had 4 items. Checked each against the live code
before touching anything — 2 were real, 2 turned out stale — then, separately, tackled the
5th thing PROGRESS flagged as still open: the landing repeating one bordered-card template.

- **Real: Latin eyebrows.** `Eyebrow`'s CSS is `uppercase`, so `fanLanding`/`creatorLanding`
  copy like `"discover"`/`"how mochi works"` rendered as `DISCOVER`/`HOW MOCHI WORKS` — the
  one Latin-script surface left on an otherwise Korean-first landing. Translated the 5
  live eyebrow keys (`fanLanding.eyebrow/trendingEyebrow/howEyebrow`,
  `creatorLanding.eyebrow/howEyebrow`) plus one dead one (`explore.eyebrow`, unused but
  cheap to fix in passing). English locale untouched — English eyebrows in `en.json` are
  correct as English. (`en.json` was gone by the time this merged; see the 2026-08-07
  Korean-only entry.)
- **Real, but not what it looked like: unstyled `<select>`s.** The 4 filters in
  `ExploreFilters.tsx` already had real border/padding styling — what was missing was
  hiding the OS's own disclosure-arrow glyph, which no `className` can touch, and drawing
  the design system's own chevron in its place (`appearance-none` + a new
  `IconChevronDown` in `src/components/ui/Icons.tsx`, absolutely positioned via a small
  local `FilterSelect` wrapper). Verified via the server-rendered HTML: 4 `<select>`s, 4
  matching chevron SVGs, 1:1 — no headless-browser tool available in this environment to
  confirm the pixel alignment beyond that, worth a manual look.
  **Amended on the merge into `audit/product-hardening`:** that branch had extracted a
  shared `Select` primitive (`src/components/ui/Field.tsx`) which the same 4 filters were
  already using for their label/`aria` wiring, so the chevron moved *into* the primitive
  and the local `FilterSelect` was deleted. Every select in the app gets the treatment
  now, not just Explore's four.
- **Stale: `STRONG`/`EMERGING` badges.** Live in `src/lib/grades.ts` — the retired Trust
  Report grading (DECISIONS 2026-08-01). Confirmed **zero imports** anywhere in `src/`.
  Nothing renders them; this item had already been resolved by the Trust Report's removal
  and PROGRESS just hadn't caught up. `grades.ts` itself stays (Prisma schema still
  dormant, per the standing "consciously left" note) — only the copy-fix framing was wrong.
- **Stale, and mislocated: "퍼크 still on explore."** No 퍼크 reference exists anywhere in
  the `explore` namespace or its components — grepped clean. The real, live 퍼크 mentions
  were on the fan/creator **landing pages** instead (`fanLanding.benefits.perksBody`/
  `.dashboardBody`, `creatorLanding.how.step2Body`), reworded to 혜택/아이템 to match
  current terminology. Left `perkTitle`/`perkBody`/`tierPerks` alone (zero imports, same
  dead-code class as `grades.ts` — not a live copy problem to fix).
- **The repeated bordered-card sections — asked before touching, given past precedent.**
  A previous session guessed at "the Spotify pattern" for `/home`/`/profile`/`/ranking`
  and got corrected directly by the owner (DECISIONS 2026-07-31, "Sections are bare, not
  boxed") — the same risk applied here, so rather than guess again, three options went to
  the owner: de-box the single-item sections, keep every section boxed but vary color, or
  hold for a mockup. **Owner picked de-boxing.** "Mochi explainer" and "Are you a
  creator?" (both single-item, `rounded-[24px] border border-line-2` cards on the default
  background) became full-bleed color bands (cream-warm / dark ink) — the exact treatment
  the page's own Final CTA section already used, and the one section that didn't read as
  repetitive. Benefits (4 distinct items) and Spotlight (a real profile chunk) kept their
  card treatment; both hold genuinely separate content, unlike the two that changed.
  Verified via the server-rendered HTML: the old `rounded-[24px] border border-line-2`
  markup is gone from both changed sections, the new full-bleed classes are present, and
  the Benefits/Spotlight card markup is untouched.

## 2026-08-10 — 고객센터 wired to the owner's personal email, explicitly as an interim channel
`/refund` and the footer had promised a 고객센터 that didn't exist — flagged repeatedly, most
recently as an explicit open item in PROGRESS. Owner supplied `junn223@gmail.com` to unblock it.

- **One constant, `SUPPORT_MAILTO` in `src/lib/support.ts`**, consumed by the footer's
  `support.help`/`company.help` links (fan and creator variants) and `/refund`'s "how to
  request" section (`howTo.body`, now rendered via `t.rich()` with a real `<a href="mailto:...">`
  instead of plain text naming a channel that didn't link anywhere). Swapping to a real
  channel later is a one-line change.
- **Deliberately did not touch** `support.faq`/`support.safety`/`company.about`/`company.notice`
  — those are unbuilt informational pages, not a contact channel; wiring them to an email
  would misrepresent what they are. Only the two links that actually mean "contact us" changed.
- **Flagged, not resolved, in `docs/legal/privacy-draft.md`**: a personal Gmail as the
  official 개인정보 보호책임자 contact and as `/refund`'s only channel is fine as a
  pre-registration stopgap, but is its own review point for counsel — carried as review-point 4,
  distinct from (and smaller than) the "no channel at all" problem it replaces.

## 2026-08-09 — Mochi becomes a donation bonus, not a purchase (the donation pivot)
Owner's call, following straight on from the 60%-rule drop below and a legal-research pass on
Korean prepaid-instrument regulation (전자금융거래법, amended 2024 after the 머지포인트 사태;
전자상거래법's 선지급식 통신판매 rules). The core mechanism change: `buyMochi()` — pick a mochi
quantity, pay `quantity × price` — becomes `donateMochi()` — donate a KRW amount directly to the
creator, mochi is granted afterward as a non-purchased bonus computed from the same rate.

- **The legal theory**: 선불전자지급수단 regulation hinges on the token being issued *in exchange
  for payment* (대가관계). If mochi is never sold — donation money goes straight to the creator,
  mochi is a gratuitous bonus layered on top — it plausibly falls outside that regime, landing in
  the much lighter 마일리지/적립금 (loyalty points) bucket instead. **Not settled**: whether
  "donate and automatically receive a proportional bonus" still reads as a 대가관계 despite the
  relabeling is exactly the kind of question a label doesn't resolve — flagged explicitly for
  counsel in `docs/legal/terms-draft.md` (제6조, 제8조, and item 6 of its review-points list),
  not decided here.
- **금전적 실질은 그대로다**: motoo already routed 100% of `amountKrw` to the creator's
  sub-merchant with no fee deduction (`settleToStreamer`, unchanged) — the 0%-cut goal was
  already true structurally. What changed is what the transaction *is legally shaped as*, not
  the money path.
- **The ratchet mechanism needed zero mechanical changes.** `MochiIssuance.pricePerMochiKrw` and
  the price-only-rises rule (`src/app/studio/actions.ts`'s `updateIssuance`) mean the same thing
  read forwards ("cost to buy 1 mochi") or backwards ("KRW needed to earn 1 bonus mochi") — a
  rate rising in one framing is a bonus shrinking in the other, same "early supporters got in
  cheaper" feel. `src/lib/issuance.ts` and `MochiIssuancePicker.tsx` are untouched; only
  surrounding copy changed from 발행/판매 (issue/sell) framing to 보너스 지급 (bonus-grant) framing.
- **Three field renames** (`MochiHolding.purchasedTotal` → `mochiEarnedTotal`,
  `MochiIssuance.soldQuantity` → `grantedQuantity`, `.lifetimeSold` → `lifetimeGranted`) — the old
  names actively lied about the new semantics, the same standard this project already holds copy
  to (백커→팬). `krwPaidTotal` keeps its name — a fan still genuinely pays KRW to the PG.
- **`donateMochi()` computes `mochiGranted = floor(donationAmountKrw / pricePerMochiKrw)` before
  charging**, independent of the PG (`PaymentProvider.donate` no longer returns a
  `mochiGranted` field at all — that was always motoo's math standing in a PG-owned response
  field, an architectural smell now cleaned up). A donation below the current rate is rejected
  (`DONATION_BELOW_MIN`) rather than silently accepted for a confusing 0-mochi "bonus" — owner's
  call, over silently accepting it.
- **Leaderboard/ranking basis stays mochi-earned, not KRW-donated** — a deliberate choice, made
  knowing it's now a rate-distorted proxy (early donors earn more mochi per ₩ than later ones
  under the ratchet, so a small early donor can outrank a larger later one). `krwPaidTotal` exists
  on `MochiHolding` as the undistorted alternative if this needs revisiting later.
- **`/refund`'s 7-day 청약철회 mechanic is preserved, not re-derived.** The copy was reworded
  away from "구매" (purchase) framing to "후원" (donation) framing without changing the
  underlying promise (7 days, wholly-unused, full KRW back) — mirroring the exact discipline the
  2026-08-06 postmortem already established (disclosure copy must never assert something the
  policy doesn't back). Whether the 7-day right *should* still apply to a donation the way it
  did to a purchase is an open question, explicitly not resolved by this rewording — see
  `docs/legal/terms-draft.md`'s 제8조 and review-point 6.
- Route `/s/[handle]/buy` → `/s/[handle]/donate` (permanent redirect in `next.config.ts`);
  `BuyMochi.tsx` → `DonateMochi.tsx`; `messages/*.json`'s `marketplace` namespace split into a
  new `donate` namespace (acquisition copy) and a trimmed `marketplace` namespace (redemption
  copy, unchanged). The buy-flow disclosure, onboarding subtitle, signup hero, and "how mochi
  works" landing copy were all swept for "구매"/"buy" mochi language — the copy is the clearest
  evidence of "was this a sale," so it got the most attention.
- `redeemItem`, `cancelOrder`, `fulfillOrder`, and the Order/MarketplaceItem spend-side model are
  entirely unchanged — the marketplace itself (spending earned mochi on creator items) was never
  in question, only mochi's acquisition path.

## 2026-08-09 — Dropped the 60% unused-balance refund path
Owner's call, prompted by asking "can purchases just be non-refundable?" — the same question
that produced the 2026-08-01 flat no-refund line, which was reverted six days later because
전자상거래법 §17's 7-day 청약철회 right on a wholly-unused purchase isn't something a ToS
clause can just declare away. That constraint is real and stays. The 60% rule was different:
it was never claimed to be a statutory floor, only a 신유형 상품권 표준약관 *convention* —
so unlike the 7-day right, dropping it doesn't reopen the exact risk that was already flagged
and reverted once.

- **`/refund` now has two refund paths, not three**: 주문 취소 (mochi back, unchanged) and
  청약철회 (KRW back, 7-day/wholly-unused, unchanged), plus the 법령 carve-out. Once *any*
  mochi from a purchase is spent, there is no further voluntary refund path — the remaining
  balance just stays spendable in that creator's market.
- **This is the narrowest defensible position, not a settled one.** Whether the 7-day right
  itself can be narrowed or excluded for this product (e.g. a digital-content exemption with
  explicit prior consumer consent) is still an open, counsel-only question — dropping the
  60% rule doesn't answer it, it just stops adding voluntary refund surface on top of it.
  Carried forward as an explicit question in `docs/legal/terms-draft.md`.
- **`krwPaidTotal` on `MochiHolding` loses its main consumer.** 2026-08-06 had made it "the
  ledger for both KRW paths"; with the balance path gone it reverts to being relevant mainly
  to the 법령 carve-out (e.g. refunding a minor's full purchase), which is closer to its
  original 2026-08-01 framing. Still unread by any code — no PG exists to pay through yet.
- Updated: `/refund` copy (ko/en), `messages/*.json`'s `refund` namespace (section removed,
  intro and the withdrawal note reworded, remaining sections renumbered 1–5), `CLAUDE.md`,
  `README.md`, and `docs/legal/terms-draft.md`'s 제8조. `PROGRESS.md`'s refund review item
  updated to match — the termination sub-item no longer reads as "60% rule vs termination"
  since there's no 60% rule to weigh it against anymore.

## 2026-08-07 — Schema changes go through migrations, and prod had already drifted

The Vercel build ran `prisma generate` but never `db push`, so production's schema only
changed when someone remembered to push it by hand. DEPLOYMENT had carried a note about this
being "a manual pre-deploy step" since July, with the caveat that data was reseedable and it
could wait.

It could not. By the time migrations were adopted, production was **three stages behind**: the
six Phase-1 tables still present with ~900 rows, `RateLimit` and `Backer.pendingDeletionAt`
missing, no `_prisma_migrations` table. Deploying would not merely have failed a build —
`getCurrentBacker` selects `Backer.pendingDeletionAt`, so every authenticated page would have
500'd. Nothing checked, so nobody knew.

The build is now `prisma migrate deploy && next build`, with a `0_init` baseline generated from
the current schema. **A failed migration fails the build**, and Vercel keeps the previous
deployment live rather than promoting code whose schema doesn't match — a loud failure instead
of the silent drift that caused this.

`pnpm check:drift` (read-only) reports production against the repo. It exists because the
lesson here isn't "remember to push the schema", it's "have something that tells you when you
didn't".

**Deliberately not automated:** bringing production up to date drops six tables and ~900 rows.
That is irreversible, needs a backup, and needs someone to confirm the rows really are seed
data. It is a runbook (`scripts/baseline-prod.md`), not a script that runs itself.

**Constraint:** local databases created with `db push` have no `_prisma_migrations` table and
will fail `migrate deploy` with **P3005**. Baseline them once with
`prisma migrate resolve --applied 0_init`. The local database hit this immediately, which is
the cheapest possible place to learn it.

## 2026-08-07 — Account deletion: 30-day grace, and unspent mochi is forfeited

Deleting is scheduled, not immediate: the account enters a 30-day window, the user is told
when it ends, and **signing back in cancels it** — done in the `jwt` callback so it works for
every provider, and because returning to the product is the clearest statement of intent there
is. Requesting deletion revokes the session via `tokenVersion`, the same mechanism logout uses.
Nothing in the stack ran scheduled work before, so this also needed a runner: a Vercel cron on
an idempotent, resumable purge that works account-by-account in its own transaction and refuses
to run without `CRON_SECRET`.

**Creator accounts are refused outright.** Deleting a `Streamer` cascades to its marketplace,
its orders, and *every holder's balance* — one person leaving would destroy other people's
money. Creator termination needs its own flow and its own counsel review.

**Unspent mochi is forfeited.** No refund, and the units are *not* returned to the creator's
sellable supply either. The holding rows cascade away with the account.

Those two halves are load-bearing together. Payment settles directly to the creator's
sub-merchant at purchase time (spec §8), so "no refund + units returned to supply" would let the
creator sell the same mochi twice — paid twice for one fulfilment obligation. An earlier revision
of this decision did exactly that and was wrong. "No refund + units stay sold" is the coherent
version: the creator is paid once and never has to fulfil. A windfall, but bounded, and not a
resellable asset.

⚠️ **This is the owner's call, not counsel's, and it is the highest-risk position in the
product.** Forfeiting an unspent prepaid balance is the part most likely to be challenged under
the 선불전자지급수단 rules, and it sits awkwardly beside `/refund`, which already promises a 잔액
환불 once 60% is spent — a user below that threshold now does *worse* by deleting their account
than by asking for a refund. **Constraint: take this to counsel with the creator/service
termination clause — they are the same question.** If the answer changes, the refund call goes at
the top of the purge in `src/lib/accountDeletion.ts`; nothing else is affected. The deletion
confirmation dialog states the forfeiture explicitly, so the user is told before they confirm.

## 2026-08-07 — Rate limiting lives in Postgres, not Redis, and fails open

Nothing was throttled: buy, redeem, follow, login, signup and the handle check could all be
called as fast as a script could issue them. A cap per purchase is not a cap per minute, and the
credentials provider was open to stuffing.

The conventional answer is Upstash. It was rejected: a hosted dependency plus a secret is hard to
justify for a product doing single-digit RPS, and the database is already on every request path.
A counter table costs one upsert. Every caller goes through `checkRateLimit`, so the internals can
be swapped for a real bucket store when traffic justifies it.

**Fails open on purpose.** If the limiter itself errors, the action proceeds. A limiter outage must
not take payments down, and everything it backstops — ownership checks, purchase ceilings, balance
guards — is still in force. Closed windows are pruned by the same nightly cron as the account
purge; without that the table grows forever.

## 2026-08-07 — The Trust Report schema is dropped, not dormant; `Update` survives

The 1.0.0 removal (2026-08-01) left the schema in place and called it dormant. The owner confirmed
on 2026-08-06 that the retirement is permanent, so `Tier`, `Backing`, `Perk`, `PerkDelivery`,
`TrustReport`, `FoundingMembership` and the `BackingDisplay` / `BackingStatus` / `PerkStatus` /
`ReportStatus` / `Grade` enums were dropped outright, along with the 954 LOC that read them (the
`/s/[handle]/back` subtree turned out to be a closed island — routable, linked from nowhere, and
the only consumer of `lib/backing.ts` and `BackingFlow`).

**`Update` is the exception and stays.** The home feed reads it, creator pages render it, and it is
what creator posts are built on (Stage 9). Two knock-ons: `Update.tierId` pointed at the dropped
`Tier` and went with it, and `UpdateVisibility.tier` was removed — the enum is now
`public | backers`.

**Constraint:** CLAUDE.md's "grades/report schema stays in Prisma, fully dormant" line is now false
and was rewritten. Reviving any of this means a real migration, not un-commenting.

## 2026-08-07 — Korean only: `en.json` deleted rather than maintained for nobody

`en.json` was kept at full parity — 800+ keys — behind a language switcher that was never built.
`LOCALE_COOKIE` was documented as "set by the language switcher"; no such component existed
anywhere in `src/`, so every user got `ko` and no user could ever reach the English catalog.
Maintaining both halves of a feature with no entry point is worse than shipping one.

Deleted, along with the cookie, the negotiation and `hasLocale`. **next-intl stays**: keeping copy
out of components is a project invariant independent of how many languages ship, and it is what
`check:vocab` scans. Re-adding a locale means a file plus a switcher; nothing else assumes one.

## 2026-08-07 — Mobile gets a bottom tab bar, not a hamburger

The Sidebar is `hidden lg:block` and the RightRail `hidden xl:block`, so below 1024px neither
rendered — and the avatar dropdown is identity-only. The result: **the only route to `/explore` on
a phone was a link at the bottom of the footer.** For a Korean creator-economy product, where
traffic is overwhelmingly mobile, the discovery surface was effectively unreachable for most users.
(The codebase had 114 `sm:` utilities against 17 `lg:` — designed at desktop width and narrowed.)

A bottom tab bar rather than a hamburger: 홈 · 둘러보기 · 알림 · 프로필 are peer destinations users
switch between constantly, which is what a tab bar is for, and it costs no header space. Two
consequences worth noting: the header bell is now `lg:`-only (the tab bar carries 알림 with the same
badge, and two identical controls on a 375px header was already making the Studio pill wrap), and
`viewportFit: "cover"` is required or the bar's `env(safe-area-inset-bottom)` resolves to zero on
notched devices.

**Still open:** the following list remains desktop-only. Surfacing it on mobile needs a drawer with
its own focus management; the critical navigation gap is closed without it.

## 2026-08-07 — Purchase ceilings are per-transaction, and the age gate lives in `mochi.ts`

`quantity` was `z.number().int().positive()` with no upper bound, and the **mock** PG — still the
production provider — returns `ok: true` unconditionally. A crafted request could mint millions of
mochi for free, and a large enough one overflowed the Int4 columns *after* the charge.
`MOCHI_MAX_PURCHASE_QTY` (10,000) and `MOCHI_MAX_PURCHASE_KRW` (1,000,000) are checked before the
PG is called. They coincide at the 100원 price floor; above it the KRW ceiling binds.

The age gate went into `buyMochi`, not just the server action. `ageVerified`/`guardianConsent` were
read **only** by the dead `/back` flow, while `/refund` promises minors a statutory carve-out — the
product can't honour a rule it never evaluates. `/onboarding` already hard-requires `verifiedAt`, so
this closes the action-level path and, more importantly, makes the rule testable. A minor is not
blocked outright: recorded guardian consent lets them transact, which is what the column is for.

**The mock verifier had to change too.** It hardcoded `isAdult: true`, so no account could ever be a
minor and the gate would have shipped as untestable dead code. It now derives age from the birth
year, and `VERIFICATION_MOCK_MINOR=1` produces a minor.

## 2026-08-07 — CSP ships Report-Only; HSTS ships without `preload`

There were no security headers at all. Added `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, `Permissions-Policy`, HSTS (prod only) and CSP.

**CSP is Report-Only.** Next injects inline bootstrap scripts and Tailwind emits inline styles, so
enforcing needs a per-request nonce threaded through the middleware — bigger than the stage, and
getting it wrong takes the site down rather than degrading it. Report-Only gives the violation data
at zero blast radius. `style-src` must currently allow jsdelivr because Pretendard is a CDN
`@import`; **self-hosting the font is a prerequisite for tightening to `'self'`**. Note
`upgrade-insecure-requests` is deliberately absent: browsers ignore it in a report-only policy and
log a console error for it on every page load.

**HSTS has no `preload`.** That directive bakes the domain into browsers' shipped preload lists,
takes months to reverse, and would strand any future subdomain that can't do HTTPS. One word to add
whenever that's a deliberate decision.

Separately, `images.remotePatterns` was `hostname: "**"` — an open image proxy, a standard
SSRF/bandwidth-abuse vector. It was pure risk: `next/image` is used **zero** times (avatars and
covers are data URLs rendered with plain `<img>`). Narrowed to the OAuth avatar CDNs.

## 2026-08-06 — `/refund` states real positions: 7-day 청약철회, 60% rule, 법령 carve-out
> **The 60%-rule half of this entry is superseded by 2026-08-09**, which dropped the
> unused-balance refund path entirely (never a statutory floor, just a 표준약관 convention).
> The 7-day 청약철회 path and the 법령 carve-out below are unchanged.

The 환불·청약철회 page had been a placeholder since the non-refundable decision (2026-08-01)
flagged it as the one open item that was a liability rather than a nicety. It now exists,
and the flat "구매한 모찌는 환불되지 않아요" line it was sitting against is gone.

- **Three refund paths, deliberately separated**, because they were being conflated in copy
  and they behave differently in the schema:
  1. **주문 취소 → mochi back.** Already built (`cancelOrder`); the item order reverses and
     `MochiHolding.balance` is restored. Never touches KRW.
  2. **청약철회 → KRW back.** Within 7 days, and only if *not one mochi* from that purchase
     has been spent. Not built — no PG to refund through.
  3. **미사용 잔액 → KRW back.** Once 60% or more of what was bought from a creator has been
     spent, the remainder is refundable at the price paid. Not built.
- **The positions are the owner's calls, not counsel's.** Chosen 2026-08-06 from options put
  to him explicitly: the 7-day/unused-only window (the statutory default shape, lowest risk)
  over both a pro-rated version and the flat no-refund posture; and the 60% rule (the
  신유형 상품권 표준약관 convention Korean consumers already expect) over termination-only.
  **Nobody has checked any of this against 전자상거래법 §17 or the 선불전자지급수단 rules.**
  That review is now the gate on `PAYMENT_PROVIDER` leaving `mock` — recorded in PROGRESS.
- **Termination is deliberately NOT in the policy.** The owner was offered "60% rule" vs
  "termination-only" vs "both" and picked the first, so the page says nothing about a
  creator quitting or the market closing. It was flagged at the time as the clause hardest
  to defend omitting; left out rather than added unilaterally, and carried as an open item.
- **`krwPaidTotal` finally has a consumer.** It was kept at 2026-08-01 as "the ledger for the
  legal-exception path"; both new KRW paths price the refund off it. Still nothing reads it
  yet — the accounting is per-holding, and the 7-day rule needs it **per purchase**, so
  whoever builds the flow will need a purchase-level record that does not exist today.
- **The buy-flow disclosure was the real bug.** `marketplace.disclosure` promised a flat
  no-refund with law-only exceptions; shipping the page without rewriting it would have left
  the product contradicting its own policy at the point of payment. It now summarises the
  7-day rule and links to `/refund`.
- **Page posture: a real policy, with the review gated in docs** rather than a visible
  "draft" banner. No real money moves yet (mock PG), so the page is accurate for the current
  state, and a provisional-looking policy reads worse to users than a plain one.
- The footer's 환불·청약철회 link had existed since Phase 1 pointing at `#`; it, 이용약관 and
  개인정보처리방침 are now wired. The latter two still resolve to placeholders.

## 2026-08-03 — Cross-host hops target the canonical host, not the bare apex
Prompted by "there are consumer pages under the studio domain — aren't these duplicates?"
- **They aren't**, and that was checked against production rather than argued from the code:
  `studio.themotoo.com/{explore,home,profile,login,s/[handle]}` all 307 to the apex. The
  duplicates are visible only in dev.
- **The dev carve-out (`isProd ? crossHost(...) : NextResponse.next()`) is still required.**
  Its comment predates `crossHost`, which hand-builds an absolute `Location` precisely to
  dodge Next's dev-server relativization — so it was worth re-testing whether the carve-out
  had become vestigial. It hasn't: removing it produced `Location: /explore`, relative,
  which the browser resolves against `studio.localhost` into an infinite loop. `crossHost`'s
  trick works toward the *studio* host (a different origin from the dev binding) but cannot
  work toward the apex, because the apex **is** the dev binding. Reverted.
- **What the question did surface**: Vercel serves the app on **www** and 308s the bare apex
  to it, so `host.replace(/^studio\./, "")` landed on a redirect, making every cross-host hop
  two redirects — on every click of the Studio nav's motoo pill. `src/proxy.ts` now maps the
  stripped apex to `PROD_CANONICAL_APEX`. Measured after deploy: hops 2 → 1.
- **The domain is hardcoded**, matching `splitEnabled()` immediately below it. The split only
  ever activates on this domain or localhost, so there is nothing to derive a canonical host
  from; dev (`studio.localhost` → `localhost:PORT`) and Vercel previews (split disabled
  entirely) keep the plain host-derived value. Host math was verified for all six host shapes
  before shipping, since this branch only executes in production.

## 2026-08-02 — Auth transitions navigate for real; a server-action redirect skipped middleware
The open item from the logout investigation: right after login, a **non-onboarded** user
landed on `/` (the marketing landing) instead of `/onboarding`. Confirmed pre-existing by
stashing the logout fix and reproducing on the old code.
- **Cause, from a network trace**: the action responds `303 … Location: /;push`, and then the
  client **never requests `/` at all** — Next resolves the destination as part of the action
  and finishes with a client-side transition. So neither `/`'s own signed-in routing nor the
  middleware's onboarding gate ever ran. A reload showed the correct `GET /` → 307 →
  `/onboarding`, which is why the gate itself looked fine in isolation (and in curl).
- **`revalidatePath("/", "layout")` does not fix it** — tried and traced. The problem isn't a
  cache we control serving a stale entry, it's that no request is made at all.
- **Fix**: `loginAction`/`signupUser` now use `signIn(..., { redirect: false })`, return
  `{ ok: true }`, and the form does `window.location.assign("/")`. A full navigation forces a
  real document request carrying the fresh session cookie, so middleware runs and the user
  lands where they should. Same medicine as the logout fix for the same underlying reason:
  **an auth-state change can't be trusted to a soft transition.**
- Signup had the identical bug and was fixed the same way — worse there, since a brand-new
  account is exactly the one that must reach onboarding; it was landing on `/home`.
- **The failure paths still return rather than navigate**, so bad credentials and a duplicate
  email still render their inline error instead of reloading the page. Verified.
- Cost: login/signup now cost one full page load instead of a soft transition. For an auth
  transition that's the right trade — a clean document is what you want anyway, and it's the
  same reason logout is a native form POST.

## 2026-08-02 — The shell has a height floor, so collapsing a rail can't move the footer
User: collapsing either rail pushes the footer down compared to having both open. Correct,
and measurable — on `/ranking` the footer moved **176px**, on `/notifications` 22px, on
`/profile` 0px.
- **Cause**: the two rail states are sized differently on purpose. A *collapsed* rail is
  `h-[calc(100vh-64px)]` — a fixed height it needs, or its divider line stops short (the
  2026-07-31 fix). An *expanded* rail is `max-h-[calc(100vh-64px)]`, i.e. content-sized. With
  `items-start` on the shell row, the row is as tall as its tallest child, so on any page
  whose content is shorter than the viewport the collapsed strip became the tallest thing in
  the row and dragged the footer down with it. `/profile` showed 0px precisely because its
  content already exceeds that height — which is why it looked intermittent.
- **Fix**: `min-h-[calc(100vh-64px)]` on the shell row, matching the strip's own height. The
  row is never shorter than a collapsed rail, so the rails can't be the tallest child and the
  footer's position depends only on content. Measured 0px movement across all four rail
  combinations on `/home`, `/explore`, `/ranking`, `/notifications`, `/profile`, `/settings`.
- **Chose the floor over shrinking the collapsed strip** — dropping the strip's fixed height
  would move the footer back but reintroduce the stop-short divider the 2026-07-31 entry
  fixed. The floor satisfies both, at the cost of short pages now putting the footer at the
  bottom of the viewport instead of floating mid-screen (the ordinary sticky-footer look).
- **`/s/[handle]` still moves 20px and that's correct, not a miss**: collapsing a rail widens
  the middle column, so its content reflows into *less* height — the footer moves **up**, the
  opposite direction, and it's genuine reflow rather than chrome forcing the row.
- **Left alone**: an *expanded* rail's divider still ends where its content ends, so the two
  rails' lines are different lengths when open. Pre-existing, cosmetic, and a different thing
  from what was reported; fixing it means giving expanded rails a fixed height too, which
  changes their scroll behaviour.

## 2026-08-02 — Logout actually revokes the session (`Backer.tokenVersion`)
Reported as "after logging out then clicking 회원가입 I'm occasionally logged back in."
Reproduced **3 of 8 logouts**, then pinned down deterministically. It was not cosmetic.

**Root cause.** Sessions are stateless JWTs, so `signOut()` can only ask the browser to drop
the cookie — it cannot invalidate the token. Three facts combine badly:
1. **Auth.js re-issues the session cookie on every authenticated request.** Every
   `GET /home?_rsc` came back with a fresh `Set-Cookie`. (`session.updateAge` does not turn
   this off — tested; v5 re-issues on every `auth()` call regardless.)
2. The logout response carries a `SET` *and* a `DELETE` for the cookie, in that order.
   Correct on its own.
3. **A token replayed after logout still worked.** Verified by hand: `/home` → 200, rendered
   signed-in, and the server re-planted the cookie.

So any request still carrying the old cookie — an in-flight RSC fetch, a queued prefetch —
landing after the delete got a valid session back *and* re-wrote the cookie. Intermittent
purely because it depends on whether such a request happens to be in flight: adding a settle
wait before logging out gave 0/10 leaks, while the real timing (land on `/home`, click the
avatar, click 로그아웃) leaked repeatedly. The deeper half is worse than the annoyance — a
token captured before logout kept working until its 30-day expiry.

**Fix, in two layers that cover each other's gap:**
- **`Backer.tokenVersion` (new).** Logout increments it; the `jwt` callback rejects a token
  whose `ver` no longer matches and returns null, ending the session. A straggler is now
  rejected instead of being handed a session, and a captured token dies at logout.
  - **A counter, not an issued-at cutoff.** `iat` has second granularity, so a
    `sessionsValidAfter` timestamp would either reject a token minted in the same second as
    the logout (breaking log-out-then-straight-back-in) or let stragglers through for a
    whole second — which is exactly the window being closed. A counter has no timing window.
  - Cost: one indexed `SELECT` per authenticated request. The `jwt` callback already ran on
    every request; it just used to short-circuit for onboarded users. The **edge middleware
    is unaffected** — it uses the Prisma-free `auth.config.ts` and only decodes the JWT, so
    a revoked token could still satisfy the onboarding gate for one request. That gate is
    routing, not authorization; every page-level `auth()` does the real check.
  - **This logs everyone out once on deploy.** Existing tokens carry no `ver`, so they fail
    the check. That's intended — it also revokes any session leaked by this bug.
  - Logging out revokes **all** of that account's sessions, not just the current device.
    There's no per-device session state to scope it to, and for a payments product the safe
    direction is the right default.
- **Logout is a native form POST to `/api/logout`, not a server action.** A server action
  logout finishes as a client-side transition, leaving the current document and its in-flight
  RSC fetches alive across the sign-out. A real navigation makes the browser tear the
  document down and cancel them. Neither layer suffices alone: the navigation can't help a
  request already on the wire, and the version bump can't stop a stale RSC *render* that was
  already produced.

**Verified**: replayed pre-logout token now 307s and renders signed-out, and the cookie the
server still writes is inert (fails to authenticate on `/home` and `/explore`; the check
re-runs against the DB every request, so it can't come back). 0 leaks in 14 login→immediate
logout→회원가입 cycles, 0 login failures. Onboarding gate, `completeOnboarding`, and
`createStudio` (both `unstable_update` paths) all still work.

**Found while testing, NOT fixed (pre-existing — confirmed by stashing the fix and
re-testing):** immediately after login, a non-onboarded user lands on `/` (the marketing
landing) instead of being bounced to `/onboarding`. The middleware gate itself is fine —
any subsequent navigation redirects correctly, and curl shows `/` → 307 → `/onboarding`. It's
the client-side transition right after the login server action that doesn't honour it. Out of
scope for this fix; worth a separate look.

## 2026-08-02 — The Studio pill asks before it enrolls; creator-setup heading un-inverted
Two fixes to the same moment: a fan clicking 스튜디오.
- **The pill used to drop a fan straight into `/creator/onboarding`** — a full setup form
  (display name, handle, type, category, bio, issuance) with no explanation of why clicking a
  button named after a *place* produced a form for becoming a *thing*. It read as a bug.
  Non-creators now get a short modal instead: you aren't registered as a creator, the Studio
  needs that, here's the button to do it (`나중에 하기` to back out). The pill renders as a
  `<button>` for a fan and stays a plain `<Link href="/studio">` for a creator — the fast path
  for someone who already has a console is untouched.
  - **Scoped to this pill deliberately.** The explicit creator entry points — the landing's
    크리에이터로 시작하기, `/creators`, the signup role modal's 크리에이터 card — already
    state the intent in their own label, so a confirmation there would be friction, not
    clarity. They still go straight to `/api/become-creator`.
- **New `src/components/ui/Modal.tsx`** — portal + Escape + backdrop-click + ✕, extracted so
  the second modal in the nav doesn't re-derive the portal trick. **The portal is
  load-bearing**: the nav header's `backdrop-blur` creates a containing block that would
  otherwise anchor a `fixed` overlay to the header instead of the viewport (the bug
  `SignupModal` hit in DECISIONS 2026-07-24). It takes `closeLabel` as a prop rather than
  reaching for next-intl, so it works from any namespace. `SignupModal` predates it and still
  has its own copy of the logic — left alone rather than refactored, since it works and
  wasn't what was reported.
- **Creator-setup heading hierarchy un-inverted.** The page led with a small mono eyebrow
  ("크리에이터 시작하기") above a much louder pitch line ("나만의 모찌 마켓을 열어보세요"),
  so the loudest text on screen didn't say where you were — which is exactly what made the
  unexplained jump disorienting. Swapped: what the page *is* becomes the H1, what it *gets
  you* becomes a coral supporting line above the existing detail text. Message keys renamed
  to match their new roles (`eyebrow` → gone, `title` → 크리에이터 시작하기, new `tagline`)
  rather than leaving keys whose names contradict their contents.

## 2026-08-01 — Creator status is shown, not inferred (`크리에이터 등록 완료`)
Accounts are additive (2026-07-12), which is good for the model but means nothing on a page
ever *says* you're a creator — the Studio pill looks identical whether you own a Studio or
are being invited to open one. New shared `CreatorBadge` (`크리에이터 등록 완료`) renders in
the two places a user looks for who they are: the nav's avatar dropdown header and their own
`/profile` identity block.
- **Takes `label` as a prop instead of calling `useTranslations`** — `UserMenu` is a client
  component with no next-intl of its own (the nav hands it every string), while `/profile` is
  server-rendered. One component serves both only if the string comes from outside.
- **Sage, not coral.** It's a settled state, not a call to action; the Studio pill sitting
  next to it is the thing to click. Same reasoning as the 즉시/요청 fulfillment chips.
- **Keyed off `session.user.creator`**, the Studio handle already in the JWT — no extra query
  on either surface. Copy lives in `common` since two namespaces need it.

## 2026-08-01 — Mochi is non-refundable; user-uploaded images; creators land in the Studio
> **The refund half of this entry is superseded by 2026-08-06.** The flat no-refund line
> below was narrowed once the policy page was actually written: 7-day 청약철회 on a wholly
> unused purchase, 잔액 환불 past 60% use, plus the 법령 carve-out. The "flagged, not
> resolved" note at the end of the refund section is what got resolved. Everything here
> about uploaded images and Studio landing still stands.

Second feedback pass the same day. The two structural decisions here are the refund policy
and how uploaded images are stored.

- **Mochi is non-refundable by default.** Owner's call, reversing the "unspent-refundable"
  line that had been in the pitch since 2026-07-09: the only refunds are the ones the law
  compels (a minor's payment being the named example). `marketplace.disclosure` rewritten in
  both locales, and the constraint updated in `CLAUDE.md` + `README.md` so future work
  doesn't reintroduce the old promise.
  - **The "not a security" argument survives, and gets stronger.** The 2026-07-14 entry
    leaned on *non-transferable + refund-at-paid ⇒ no buy-low-refund-high*. Removing the
    refund removes the last cash-out path entirely, so there is even less of a speculation
    story. What it does NOT change: mochi still isn't investment/return vocabulary, and
    `pnpm check:vocab` still gates that.
  - **Flagged, not resolved**: Korean 전자상거래법 §17 gives consumers a withdrawal right
    (청약철회) on unused prepaid content that a flat "no refunds" line can sit awkwardly
    against, and 선불전자지급수단 rules add their own. The owner framed the exceptions as
    "enforced by law," which is exactly the right shape — but the actual 환불·청약철회 policy
    page is still a placeholder, and that's where the real carve-outs have to be written
    before this goes near real money. `MochiHolding.krwPaidTotal` stays: it's now the ledger
    for the *legal-exception* path rather than a general refund flow.
- **Uploaded images are data URLs in Postgres** (`Backer.avatarUrl`,
  `MarketplaceItem.coverImage` — new). motoo has no object storage, and item thumbnails /
  creator covers are code-defined precisely to avoid it (2026-07-19, 2026-07-29). But a
  profile picture and a cover photo have to be *the user's own* image, so the browser
  center-crops and re-encodes the picked file to a small JPEG (`ImagePicker` +
  `src/lib/imageUpload.ts`) and the resulting `data:` URL goes in an ordinary String column.
  Chosen over a Supabase Storage bucket (which the plan does include) because it needs no
  bucket, no service key, and no dev/prod drift — it works the moment `db:push` runs.
  - **Budgets are enforced on both sides and deliberately small**: avatars 192×192 / 60KB
    hard cap (they inline into the nav on *every* page), covers 640×360 / 140KB (a market
    grid can show 20 at once). The client encoder steps JPEG quality down until it fits;
    `parseImageDataUrl` is what actually bounds the column, coercing anything malformed or
    oversized to null — same "never trust the client" treatment `thumbnailKey` already had.
    It accepts only `image/jpeg|png|webp`, so `data:image/svg+xml` (a script-execution
    vector) can't be stored.
  - **The avatar is deliberately NOT in the JWT** — a data URL would blow past the 4KB
    session-cookie limit. `Nav` reads it with a one-column query (`getAvatarUrl`) alongside
    the unread-count query it already ran.
  - **A cover replaces the curated tile rather than sitting next to it**: an item card shows
    the photo full-bleed at 16:9 when there is one, and the `thumbnailKey` tile only when
    there isn't. The picker's label says so, so the tile reads as a fallback, not a rival.
- **The creator profile page fills its column and boxes its sections.** Reverses two earlier
  decisions *for this page only*: the 900px cap from 2026-07-31 ("one content width") and
  the bare-section treatment from the Spotify pass. Rationale from the owner: the rails
  already narrow the middle column, so a second cap inside them stranded the market grid in
  whitespace. 후원자 랭킹 / 마켓 / 소식 are now three `rounded-[20px] border bg-card` panels,
  and the item rows inside them drop to `bg-panel` — the existing "inset panel on a white
  card" pattern — so boxes don't nest card-on-card. Headline stats stay capped at 440px:
  stretching two numbers across the full column reads as two empty banners, not as "filled."
  Other ConsumerShell pages keep the 900px standard; this is a scoped exception, not a
  reversal of the rule.
- **A creator's landing surface is the Studio.** `/` now sends `session.user.creator` to
  `/studio` (forwarded to the subdomain by `proxy.ts`) and everyone else to `/home`. Login
  and a bare domain visit both route through `/`, so the fork lives in exactly one place.
  This does **not** weaken the additive-account model (2026-07-12): `/home` stays fully
  reachable and the Studio nav's motoo pill goes straight there — it's a default landing,
  not a mode.
- **`motoo studio` wordmark on the Studio host** — both hosts share one `Nav`, so the
  wordmark is what tells you which product you're in at a glance. "studio" is set in the
  muted weight so it reads as a qualifier rather than two words competing.
- **Creator setup is skippable (`나중에 하기` → `/home`)** — opening a Studio is additive, so
  a user who bails still has a working fan account. Nothing is persisted on the way out, and
  the nav's Studio pill routes a non-creator straight back into the flow.
- **Korean titles use `break-keep`.** Found by screenshotting the reworked profile page:
  boxing the market section narrowed the item cards enough that Korean titles broke
  mid-word (실시간 샤/라웃). The browser's default `word-break: normal` treats a Hangul
  syllable as a break opportunity; `keep-all` is the correct CJK rule. Applied to the item
  titles on both the fan-facing and Studio cards — a class of bug that only shows up in a
  screenshot, never in `tsc` or a DOM assertion.

## 2026-08-01 — Fan signup no longer inherits creator intent; 백커 retired for 팬
Five reported fixes from one pass through the signup flow; the first three share a root
cause.
- **`creatorIntent` was sticky, so a fan signup ended in creator onboarding.**
  `/api/become-creator` drops a 7-day `creatorIntent` cookie and `/onboarding` persists it
  onto the Backer row so the combined signup → onboarding → Studio-setup flow survives an
  OAuth round-trip. Nothing ever cleared it: a visitor who clicked 크리에이터로 시작하기
  once and then signed up as a 후원자 was still handed `/creator/onboarding` at the end of
  fan onboarding. Fixed with **`/api/fan-signup`** — the mirror of `/api/become-creator`:
  it deletes the cookie and redirects to `/signup`. Every 후원자 entry point now routes
  through it (`SignupModal`'s fan card, both landing CTAs, the signup page's
  "plain signup" escape hatch, which previously used `/api/become-creator?clear=1`). The
  principle: picking a role *sets* the intent one way or the other; neither branch may be
  reached by leftover state. The creator flow itself is untouched — this excludes creator
  onboarding from the *fan* path only.
- **That same stale intent explains "signup shows up again after onboarding."**
  `completeOnboarding` sent the fan to `/creator/onboarding`, whose own guard falls through
  to `/api/become-creator` → `/signup` if the session isn't resolved yet — so a fan finished
  onboarding and landed back on the signup page. With the intent fixed the detour is gone,
  and the terminal redirect is now **`/home` directly** (was `"/"`, which only bounces a
  signed-in user to `/home` anyway — an extra round trip through the marketing landing to
  reach the same place). Same change in `/onboarding`'s already-onboarded guard and
  `signupUser`'s `redirectTo`.
- **50만원 is the recommended issuance.** `MOCHI_RECOMMENDED_PRESET` (`"m"`) in
  `src/lib/issuance.ts` is now what a fresh setup starts on (was `"s"`, 10만원 — the first
  item in the list, not a recommendation) and carries a 추천 badge plus a persistent coral
  outline in `MochiIssuancePicker`. Rationale: big enough that a market of a few items is
  reachable, small enough not to read as an intimidating obligation on day one — issuance
  is a fulfillment duty, not a fundraising target (see 2026-07-14). The badge renders in
  the Studio editor too; the recommendation doesn't stop being true after setup.
- **The zero-holdings home primer is now three real links.** "모찌는 이렇게 쓰여요" rendered
  three icon+title+body blocks that looked like entry points and did nothing — the first
  thing a brand-new signup sees on `/home`. Each step is a `<Link>` now, with a hover lift
  on the icon tile and an arrow on the title. **All three go to `/explore`**: with no mochi
  held anywhere, find-a-creator → send-mochi → spend-in-their-market all necessarily start
  in the same place, so three different destinations would be invented, not real.
- **백커 is retired; the word is 팬.** Swept from `messages/ko.json` (explore's filter/sort
  labels, the landing's spotlight stat) and `prisma/seed.ts` (tier perks, perk
  descriptions, a seeded update title), with the parallel English strings aligned to
  "Fans"/"Fan count". This finishes the sweep the 2026-08-01 Backer Wall entry deliberately
  scoped to one page. **Now build-gated**: `scripts/check-banned-vocab.ts` gained a
  `RETIRED` list (distinct from the regulatory `STRICT` list — this is a naming rule, not a
  §2 one) that fails on any 백커 in a message catalog, so it can't drift back a fourth time.
  The legacy `/s/[handle]/back` flow's copy was swept too, which leaves it saying "팬 월"
  where it used to say "백커 월" — the Backer Wall is a deleted feature and that flow is
  already orphaned, so this is a literal word swap, not an endorsement of the phrase.

## 2026-08-01 — Studio nav gets its own "motoo" pill back to the consumer app
The Studio host's nav was sparse next to the consumer nav's icon cluster + Studio pill +
avatar — just a bare avatar circle, and no one-click way back to the consumer app (the
Studio pill's whole job on the consumer side). Both share one `Nav` component
(`src/components/Nav.tsx`), branching on `onStudioHost` — no separate Studio nav to
maintain, so the fix lives entirely there.
- Added a `onStudioHost`-only pill, same classes/position as the consumer Studio pill
  (`border-line-3 bg-white ... rounded-full`), Mochi icon (matching `BrandLogo`'s own use of
  it as the brand mark) + `t("backToMotoo")` ("motoo"), linking to `/home`. Mirrors the
  Studio pill's own pattern exactly — same visual language, opposite direction.
  `showConsumerChrome` stays false on the Studio host (ranking/notifications are
  consumer-only concepts — creators never receive notifications; `notify()`/`notifyMany()`
  in `studio/actions.ts` only ever target `holderIds`/`stakeholderIds`, i.e. fans), so this
  pill is deliberately the only addition, not a wholesale clone of the consumer chrome.
- **Dev-only quirk, not a bug**: clicking it while on `studio.localhost` doesn't visibly
  cross hosts — `src/proxy.ts`'s own comment documents that a studio→apex hop is "pure prod
  behavior," and dev serves the target page inline under the same `studio.*` hostname
  instead of redirecting (avoids a same-origin loop from how Next pins the dev origin).
  Confirmed in the browser: content is correct (real `/home`), just the URL bar doesn't
  change host in dev. In production this is a real 307 cross-host redirect via
  `crossHost()`, landing on the actual apex nav (ranking/bell/Studio pill, no `backToMotoo`
  pill — `onStudioHost` correctly flips false there).

## 2026-08-01 — Trust Report removed from the website; not part of 1.0.0
User: remove Trust Report entirely — it's the original (shelved) thesis, not the mochi-
marketplace product being shipped for 1.0.0. This was a bigger job than one feature toggle:
Trust Report data (`sponsorReadiness` grades, `fanSupport`/`fanLoyalty`/`execution`/`growth`
metrics) had leaked into explore ranking, the profile hero, and marketing copy on three
separate landing pages.
- **`GradeBadge`, `SampleReport.tsx`, and `/s/[handle]/report` deleted outright** — the
  report page was already just a `ComingSoon` stub, never real, so nothing to migrate.
- **`getExploreStreamers`/`StreamerCard` stopped reading the `reports` relation.**
  `readiness`/`recurringRate`/`fulfillmentRate` are gone; `backerCount` is now a live
  `MochiHolding` count via Prisma `_count` (same fix pattern as the profile page's headline
  stat and the Backer Wall replacement, DECISIONS 2026-08-01 earlier entry — this was the
  same underlying legacy-data bug surfacing a third time). `ExploreSort` narrowed to
  `"backers" | "newest"` — `"readiness"` and `"recurring"` had no substitute once the
  report data was gone.
- **`getStreamerProfile` dropped its `reports` include entirely** — the hero's readiness
  badge and the whole "Trust Report summary" box are gone. The profile's headline stats
  (previously 후원자/재후원율/퍼크 이행/핵심 팬, three of four sourced from report metrics)
  became a 2-stat row: 후원자 (`leaderboard.totalSupporters`) and 총 모찌
  (`leaderboard.totalMochiPurchased`, a new `aggregate` in `getSupporterLeaderboard`) — both
  live, neither invented to fill a grid slot.
- **`/creators` (the creator landing page) got the deepest rewrite** — its entire narrative
  was "prove your fandom to sponsors via a monthly Trust Report" (hero, insight band, a
  dedicated report showcase section, one of five feature tiles, the testimonial). Rewrote
  around the actual 1.0.0 product: issue your own mochi, open your own market, connect
  directly with fans, no platform custody of funds. The hero's `SampleReportCard` visual
  became an inline "나의 마켓" (my market) preview card showing real marketplace-item rows
  instead of report stats. Kept what wasn't report-specific as-is: the payment-directness
  badges, the mochi-is-support explainer, 4 of 5 feature tiles, proof strip, final CTA
  structure.
- **Caught two adjacent "already-removed-feature" copy bugs while auditing**: the fan
  landing page's hero subtitle, "how mochi works" step 3, and a benefits card all still
  referenced "백커 월·파운딩 배지" (founding badge / Backer Wall) — the OLD Kickstarter-era
  concept already replaced by the live supporter ranking in the previous session's Backer
  Wall fix, just never updated on this page. Fixed alongside the Trust Report sweep since
  it's the same class of "copy promises a feature that isn't there" problem, found while
  already auditing the same files.
- **What's deliberately untouched**: `src/lib/grades.ts` (zero remaining imports, fully
  inert — left dormant rather than deleted, matching the existing "schema kept" precedent
  for the shelved thesis) and the legacy `/s/[handle]/back` (`BackingFlow.tsx`) flow, which
  still references "백커 월"/founding badges in its own copy — a separate, already-orphaned
  Phase-1 relic (not linked from anywhere live), out of scope for this pass.

## 2026-08-01 — Buy Mochi moves to its own page; Backer Wall becomes a real ranking
Three related fixes to the creator profile page, all from the same feedback pass.
- **모찌 보내기 now routes to `/s/[handle]/buy`**, a focused standalone page (Nav only,
  no ConsumerShell — same convention as the retired `/back` flow it replaces), instead of
  jumping to an in-page `#buy-mochi` anchor. `BuyMochi` itself didn't need to change at all
  — it was already a fully self-contained client component; only the wrapper moved.
  `getStreamerMarketplace` (`src/lib/streamers.ts`), a query written for this exact purpose
  but never actually called anywhere, finally gets used. `buyMochiAction`/`redeemItemAction`
  now also `revalidatePath` the `/buy` route so its balance stays live after a purchase or
  redemption made from either page.
- **Backer Wall deleted, replaced by a real supporter ranking.** The old "Backer Wall"
  (`BackerWall.tsx`, `getStreamerProfile`'s `backerWall`/`backerCount`) was leftover
  Phase-1 Kickstarter-era plumbing — founding numbers and an anonymity toggle from the
  shelved Trust Report thesis, querying the legacy `Backing` model, completely
  disconnected from the mochi model. Replaced with `getSupporterLeaderboard`
  (`src/lib/ranking.ts`) — the same live `ORDER BY purchasedTotal DESC` pattern as
  `getSupporterRank`/`getMyRankings`, just for ALL of a creator's supporters instead of
  one backer's own rank — rendered by a new `SupporterLeaderboard` component. The
  headline "supporters" stat also switched from the legacy `backerCount` (a distinct-
  founding-number count) to `leaderboard.totalSupporters` (a live `MochiHolding` count) —
  same underlying bug class, same fix.
- **"백커" swept from this page's copy** — never an agreed term (the product's fan-facing
  vocabulary is 후원자/팬, see `CLAUDE.md`); it was a leftover transliteration from the
  same Phase-1 thesis. Fixed on the headline stat label, the new leaderboard section, and
  the Updates section's "backer-only" lock label — all on this one page. Deliberately did
  *not* sweep other pages (explore's filter/sort labels, the still-routable legacy
  `/back`/`BackingFlow` flow) — out of scope for this pass, not what was reported.
- **Ranking (30%) + Marketplace (70%) side by side**, replacing the Backer Wall's old
  spot: a 10-column grid (`sm:grid-cols-10`, `sm:col-span-3` / `sm:col-span-7`), stacking
  to one column below `sm`. Freed up by moving BuyMochi out — the page no longer needs a
  single wide column for it, and the leaderboard is naturally narrower than a market grid.

## 2026-07-31 — One content width and heading style for every ConsumerShell page
User: 둘러보기 (`/explore`) uses a visibly wider column than 홈 (`/home`), and the fonts
don't line up either — asked to make every page consistent. Audited all seven pages'
middle-column wrapper: max-widths ranged from 640px (settings) to 1200px (explore), with
three different vertical-padding patterns and H1 sizes drifting between 26/32, 28/34, and
32/40px depending on the page.
- **Standardized on `max-w-[900px] px-6 py-12 sm:px-10 sm:py-16`** and H1
  `text-[28px] font-extrabold tracking-[-0.03em] sm:text-[34px]` — the values already used
  by the plurality of pages (home, ranking-adjacent, profile, settings), not a new value
  invented for this fix. Applied to `/home`, `/explore`, `/ranking`, `/notifications`,
  `/profile`; `/s/[handle]`'s hero band and post-hero content already sat at max-w-900, so
  only its horizontal padding (`sm:px-14` → `sm:px-10`) needed aligning.
- **`/explore` lost its `Eyebrow` label** ("discover" above the H1) — no other consumer
  page has one, and it was contributing to the "fonts look different" complaint by adding
  an element nothing else has. Its card grid dropped from `lg:grid-cols-4` to
  `lg:grid-cols-3` to keep cards a comfortable size now that the column is narrower
  (~257px/card either way — verified by screenshot, not just arithmetic).
- **`/settings` kept its narrower `max-w-[640px]`** — the one deliberate exception. It's a
  form, not a content feed; widening its input fields to match a 900px feed column would
  make them look oversized, not "consistent" in any way that helps. Everything else in this
  fix is a feed-style page (cards/rows), so one shared width made sense there.

## 2026-07-31 — Collapsed rail's border line was stopping short, right below the arrow
User: the reopen arrow's border-line "next to it" doesn't reach the bottom — the vertical
divider stopped a short way down instead of running the full page height. Root cause: the
collapsed strip's className had `max-h-[calc(100vh-64px)]` (a cap) with no matching `h-`
(a floor), so the `<aside>`'s actual box height was driven by its content — just one 32px
button plus `py-6` padding, ~80px total — not the sticky column's full available height.
The `border-l`/`border-r` on that box could only ever run alongside those ~80px; below
that, the aside's DOM box had already ended, so there was nothing left to draw a border
against for the rest of the viewport. Confirmed with a full-viewport screenshot (not just
a cropped one near the top, which had been hiding this) — expanded state didn't show it
because its content (cards, following list) was tall enough to reach the cap anyway; the
collapsed state's near-empty content exposed the missing floor. Fixed in both
`RightRailPanel` and `SidebarPanel`'s collapsed branch: `max-h-[calc(100vh-64px)]
overflow-y-auto` → `h-[calc(100vh-64px)]` (a fixed height, not a cap — no scroll needed for
one button, so `overflow-y-auto` came out too).

## 2026-07-31 — Both rails are foldable, persisted, same mechanic mirrored
User spec: on hover, a fold button appears to the left of the RightRail's "새로운
크리에이터" header, pushing the header right to make room; once collapsed, a reopen
button sits on the rail's own edge. "Same thing" for the left Sidebar.
- **Split each rail into server (fetch) + client (interactive) halves.** Collapse state
  needs `localStorage`, and the Sidebar's active-page highlight needs `usePathname()` —
  neither is available to the async server components that fetch `following`/`discover`.
  `Sidebar`/`RightRail` now just fetch and hand plain data to new `SidebarPanel`/
  `RightRailPanel` client components, which own all the rendering and interaction.
  `SidebarNavLinks.tsx` (the previous active-state-only split) is folded into
  `SidebarPanel` and deleted — one client component per rail, not two.
- **Same fold mechanic on both sides**, not a mirrored one: the button sits before the
  header text on hover (width 0 → real width, `group-hover`), pushing the label right, on
  both the RightRail's "새로운 크리에이터" and the Sidebar's "팔로잉" (the only other
  text header in that rail — collapsing there hides the nav links above it too, since the
  toggle controls the whole rail, not just the following list).
- **Collapsed state**: rail shrinks to a `w-12` strip holding just a centered reopen
  chevron, on the same edge the rail already sits on (right edge for RightRail, left edge
  for Sidebar) — not a fully-hidden rail with a floating button elsewhere.
- **Persistence via `usePersistedCollapse`** (`src/lib/usePersistedCollapse.ts`), a shared
  hook using `useSyncExternalStore` against `localStorage` — **not** a mount `useEffect` +
  `setState`, which trips `react-hooks/set-state-in-effect` (hit this same rule earlier
  this session on `FollowButton`; same lesson, different component). Server snapshot is
  always `false` (expanded) so SSR and first paint agree; the real preference applies once
  React reconciles against the client snapshot — a rail collapsed on one page stays
  collapsed after navigating to another.

## 2026-07-31 — `bg-panel` is literally the same color as the page background
User: "I wish there was a box behind the buttons that appear on hover and stays on
click" — about the Sidebar active-state work from minutes earlier. Root cause:
`--color-panel: #fbf6ef` in `globals.css` is byte-identical to `--color-cream` (the page
background). Every `hover:bg-panel`/`bg-panel` on a nav item sitting directly on the page
background (Sidebar links, the following-list rows, Nav's ranking icon button,
NotificationBell) was rendering a real DOM box with zero visible contrast — not a missing
feature, an invisible one.
- **Not fixing the `panel` token itself** — it's used ~20 other places as an intentional
  "inset panel on a white card" fill (`bg-card` container, `bg-panel` inset), where matching
  the page background is the point (BackingFlow, BuyMochi, profile order rows, etc.).
  Changing it would fix this bug and silently break all of those.
  - Switched the nav-hover family to `bg-cream-warm` instead — already a real, visibly
  distinct token, and already proven as this exact "hover row on the page background"
  treatment by `UserMenu`'s dropdown rows (`hover:bg-cream-warm`). No new color invented.
- Touched: `SidebarNavLinks.tsx` (hover + the just-added active state), `Sidebar.tsx`
  (following-list row hover), `Nav.tsx` (ranking icon button), `NotificationBell.tsx`.

## 2026-07-31 — `IconCompass` was genuinely lopsided; Sidebar nav gets an active state
Two more icon/nav fixes reported after the previous icon-sizing pass.
- **`IconCompass` root cause found**: its needle path (`m15 9-2 6-6 2 2-6z`) was not
  symmetric about the circle's own center (12,12) — one tip sat 4.24 units out, the
  opposite tip 7.07 units out, nearly grazing the r9 circle edge. A lopsided, off-center
  needle inside a centered circle is what read as "broken," not just small. Replaced with
  the standard, properly-centered compass-needle coordinates (tips at exactly 6 units from
  center each, waist at 3 units each — verified symmetric and margined by rendering it
  standalone at 200px before shipping, since the sidebar-sized render alone wasn't enough
  to convince eyeballing at 22px).
- **Sidebar 홈/둘러보기 now show which page you're on**: split them into a new client
  component (`src/components/SidebarNavLinks.tsx`) using `usePathname()` — `Sidebar` itself
  is an async server component fetching the following list, so it can't call the hook
  directly. Active link gets `bg-panel` + `text-coral-deep` (icon included, via
  `currentColor`); `aria-current="page"` set for a11y. `/explore` matches by prefix (covers
  filtered subroutes), `/home` is exact. Scoped to the two nav links only — the following
  list below wasn't asked for and is a different kind of item (content, not navigation).

## 2026-07-31 — RightRail: two-up grid, smaller thumbnails, instant Follow
User feedback: single-column 140px-tall cards read as oversized for a 300px-wide
suggestions rail, and following a discovered creator required a click-through to their
profile first. Changed `RightRail` (`src/components/RightRail.tsx`) to `grid-cols-2` with
90px-tall `CreatorCover` thumbnails (was a single column of 140px cards), and added a
compact `FollowButton` under each card so a fan can follow straight from the rail.
- **`StreamerCard.id` added** (`src/lib/streamers.ts`) — the type had no streamer ID, only
  `handle`; `toggleFollow` needs the real ID. The one call site (`getExploreStreamers`)
  already queries the full Prisma row, so this was a passthrough, not a new query.
- **`FollowButton` gained a `compact` prop** — same toggle logic and optimistic-update
  behavior as the profile-page button, just a smaller pill sized for a grid card instead of
  a page header.
- **Card structure**: `<Link>` wraps only the thumbnail+caption (navigates to the profile);
  `FollowButton` sits outside it as a sibling, not nested inside the anchor, so the button
  click doesn't also trigger navigation.
- **`initialFollowing` is always `false`** on this rail — `discover` is already filtered to
  exclude held/followed creators before render, so there's no already-following state to
  represent here.
- **`toggleFollow`'s revalidation widened** (`src/lib/follows.ts`): it previously only
  revalidated `/s/[handle]` and `/home`, which predates the rail being universal. Now
  revalidates every ConsumerShell page (`/explore`, `/ranking`, `/notifications`,
  `/profile`, `/settings` too) so a follow from the rail is reflected in the Sidebar's
  following list no matter which page it happened on.

## 2026-07-31 — Nav/sidebar icons enlarged; `IconStudio` redrawn (was broken)
Follow-up to the nav restructure: "enlarge all icons... revise them, some of them look
broken." A 3x-zoomed screenshot of the nav cluster confirmed `IconStudio` was a genuine
rendering bug, not just small — its "flap" path was a disconnected malformed shape and the
play-triangle collapsed into a round blob under the shared `Icon` wrapper's `strokeWidth={2}`
+ round joins. Redrawn from scratch as a simple camera/clapperboard glyph (`rect` body +
`path` viewfinder triangle) that survives the round-join stroke style. Sizes bumped across
the board: nav ranking/bell buttons `h-9 w-9`→`h-10 w-10` with icons `19→23`, Studio pill
icon `16→20` (button padding `py-2`→`py-2.5`), notification badge `h-4 min-w-4`→`h-[18px]
min-w-[18px]`, Sidebar `IconHome`/`IconCompass` `18→22`. Verified via zoomed before/after
screenshots, not just `tsc`, per this session's standing lesson that icon/layout fixes need
visual confirmation.

## 2026-07-31 — Rails pinned to the true viewport edge; rail is now universal, no exception
Two more corrections, same session, against the same "three independent columns" spec.
- **Real bug, not a taste call**: `ConsumerShell`'s flex row was wrapped in `mx-auto
  max-w-[1600px]`, so on any screen wider than 1600px the whole 3-column block centered with
  equal dead space on both sides — the sidebars sat at the edge of that centered block, not
  the edge of the browser window. "Left/right bar not aligned" was accurate: fixed by
  dropping the cap entirely (`flex w-full`) so the shell spans the true viewport, matching
  `Nav`, which got the same fix (`mx-auto max-w-[1600px]` → `w-full`) so the logo/icons line
  up with the rails beneath them instead of centering separately.
- **Column separators added**: `RightRail` gained `border-l border-line` (Sidebar already had
  `border-r`) — a visible edge between all three columns, per "the sections need visible
  separation" (clarified: this meant the three columns, not reintroducing the just-removed
  content-card boxes).
- **`RightRail` always renders its own shell now**, even with zero discover candidates (a
  `discoverEmpty` copy state instead of `return null`) — collapsing the column when discovery
  ran dry would reproduce the exact "the rail disappears" symptom this round was fixing, just
  for a content reason instead of a routing one.
- **The `/s/[handle]` exception is gone.** Explicitly reversed after re-confirming with the
  owner (their first answer picked keeping the page's own column; a follow-up message called
  the rail disappearing there a bug and asked for "no matter what" a second time — taken as
  overriding the earlier answer). The creator profile page's own two-column grid (marketplace
  +wall on the left, Buy Mochi/Report/Updates on the right) collapsed into **one column**
  (max-w 900px, matching every other page): Buy Mochi first (the header's 모찌 보내기 CTA
  already anchors there), then marketplace, trust report, backer wall, updates. `ConsumerShell`
  lost its `rightRail` prop entirely — there's no longer a caller that needs to turn it off.

## 2026-07-31 — Three independent columns; only the middle changes per page
Owner's framing: three columns act independently — left sticks left, right sticks right,
"like all sidebars, stay there no matter what." Only the middle is the actual page content.
- **New `src/components/RightRail.tsx`**, promoted out of `HomeSignedIn` where discovery
  suggestions used to live as a home-page-local column. Independent data fetch (own
  holdings/follows exclusion + `getExploreStreamers`), same shape as `Sidebar` — neither
  depends on the other or on the middle content.
- **Both rails are now `sticky top-16`** with their own `max-h-[calc(100vh-64px)]
  overflow-y-auto` — they don't just persist across navigation (`ConsumerShell` already did
  that), they now stay pinned in the viewport while the middle column scrolls, matching "stay
  there no matter what" literally rather than just "present on every page."
- **`ConsumerShell` gained a `rightRail` prop** (default `true`). **Off on `/s/[handle]`**
  specifically — a creator's public profile already has its own purpose-built right column
  (Buy Mochi, Trust Report, News) and is where money actually changes hands; a second rail
  would crowd the one page that most needs the room. Confirmed with the owner rather than
  guessed — the alternative (folding that column into the middle so the rail is truly
  universal) was explicitly on the table and rejected in favor of this exception.
- **`HomeSignedIn` lost its own discover column** — single-column now (mochi status →
  affordable → pending → news), narrower `max-w-[900px]` for readability now that it isn't
  sharing width with a rail it no longer renders itself. One discover surface, not two.

## 2026-07-31 — Sections are bare, not boxed (Spotify-referenced, corrected)
Owner asked to look at Spotify's own web player directly. First pass got this wrong: I
inspected the CSS of Spotify's **sidebar promo widget** ("Create your first playlist" —
`background: rgb(31,31,31)`, `border-radius: 8px`, no border) and generalized that into "how
Spotify boxes sections," then applied a flat-fill panel to every `/home`/`/profile`/
`/ranking` section. The owner caught it — that's a sidebar widget's style, not the home
page's. A real logged-in screenshot (Korean UI, provided directly) confirmed: Spotify's
actual content shelves (시작하기, 최근, 금요일의 새 음악을 소개합니다!) are **not boxed at
all** — a bold heading floats directly on the page background, followed by a bare row of
individually-shaped item cards. The only genuinely boxed panel on that page is the transient
queue drawer, a utility surface, not a content shelf.
- **`src/components/ui/Section.tsx` now defaults to bare** (`boxed` prop, default `false`) —
  just a heading + optional "see more" link, no fill/radius/padding of its own. Matches what
  the reference screenshots actually show, not the sidebar widget I mis-generalized from.
- **`/home`, `/profile`, `/ranking` stayed bare** — individual item cards (white `bg-card` +
  border) are the only visual boxes, exactly mirroring Spotify's individually-shaped shelf
  items. Bumped the inter-section gap (`gap-6` → `gap-9`) since a bare heading needs more
  breathing room than a boxed one did.
- **`/settings` opted back into `boxed`** — deliberately, not an oversight: it's a form/
  settings group, not a content shelf, and the reference screenshot is a music home page, not
  an account-settings page. Same instinct that made the queue drawer a real exception on
  Spotify's own page: utility surfaces can box even when content shelves don't.
- Palette unchanged throughout — motoo's own cream/coral tokens, not Spotify's black/green;
  only the *structural* pattern (bare shelf vs. boxed utility) was the reference.
- **Second correction, same session**: removing the section box wasn't enough — every item
  *inside* each section still had `border border-line-2 bg-card`, so the page still read as
  "lots of white bordered boxes," just one nesting level shallower. The owner caught this
  too ("it still looks different"). Fixed against the same real screenshot: Spotify's own
  item-level treatment has **no border anywhere** — compact rows (recently-played pills) get
  a flat fill only, and image-forward shelf items (최근, 금요일의 새 음악을…) drop the card
  entirely — bare rounded image, caption below it on the page background, no fill at all.
  - Compact rows (holdings, affordable items, pending, news, order history, ranking rows) →
    dropped `border-line-2`, kept `bg-card`, added `shadow-soft` (hover: `shadow-card`) for
    resting-state definition instead of a stroke.
  - The `새로운 크리에이터` discover cards (biggest offender) → dropped the card wrapper
    entirely. `CreatorCover`'s own `rounded-[12px]` + `overflow-hidden` now does the
    clipping directly (no `Link` wrapper box needed); caption sits below, unboxed.

## 2026-07-30 — Full nav restructure: persistent Sidebar, Ranking, Profile, Settings
Owner-driven redesign, decided via a round of clarifying questions before any code (five
forks: what ranking ranks, whether Profile absorbs `/me/mochi`, follow/holding coupling,
`/explore`'s fate, and sidebar scope). No schema change — everything below reuses the
`Follow`/`Notification`/`MochiHolding` models from earlier the same day.
- **Nav, consumer host, signed in**: 랭킹 icon → `/ranking`, 알림 icon → `/notifications`
  (both plain icon-links, no dropdown preview — `NotificationBell` lost its dropdown to
  match), a **Studio pill** (always visible, creator or not — clicking routes to `/studio`
  if they own one or into the existing become-a-creator flow if not, mirroring YouTube's
  own Studio button), then the avatar. The avatar dropdown is now **identity-only**:
  Profile, Settings, My channel (creators only) + logout — everything else moved out.
- **Persistent left Sidebar** (`ConsumerShell` wraps `Nav` + `Sidebar` + page content): 홈 /
  둘러보기 links, then the following list. Applied to every signed-in consumer page —
  `/home`, `/explore`, `/ranking`, `/notifications`, `/profile`, `/settings`, and a
  creator's public `/s/[handle]` — deliberately NOT the marketing landing, auth flows, the
  focused back/pay flow, or anywhere on the Studio host. It has to survive navigation
  rather than flicker per-page, since it contains the very nav links (둘러보기) a user would
  click.
- **Holding and Following stay strictly independent** — the Sidebar's list is Follow rows
  only; a creator you've paid but never followed will NOT appear there. To close that gap,
  **`BuyMochi` nudges a follow right after a first purchase** (an inline prompt in the
  success state, not an auto-follow) — `FollowButton` and the nudge are separate component
  instances, so a nudge-triggered toggle calls `router.refresh()` and `FollowButton` adjusts
  its displayed state **during render** when the prop changes (not via `useEffect` —
  react-hooks' `set-state-in-effect` rule flags that as an avoidable extra render; adjusting
  state while rendering is the documented pattern for "reset state when a prop changes").
- **Ranking**: a fan's rank **among one creator's supporters**, by lifetime mochi purchased
  (`MochiHolding.purchasedTotal`) — deliberately distinct from the retired Phase-1 founding
  number (arrival order, not a money signal). Computed live in `src/lib/ranking.ts`
  (`ORDER BY`, no stored rank) — cheap at this scale, and a stored value would drift the
  moment anyone buys. Surfaced two places: the dedicated `/ranking` page (one row per held
  creator) and inline on each balance card on `/home`.
- **`/profile` absorbs `/me/mochi`** (holdings + order history) behind an identity header
  (nickname, handle, avatar); `/me/mochi` now redirects there. **`/settings` is new** —
  nickname/handle (reuses onboarding's `checkHandle` live-availability action) and password
  change, gated behind `backer.passwordHash` existing (OAuth-only accounts see a note
  instead of a form they can't use). Distinct from the Studio host's own `/settings`
  (creator profile) — different hosts, no route collision (`src/proxy.ts`'s studio rewrite
  only fires when the request host starts with `studio.`).
- **`/explore` is unchanged** — kept exactly as the filter/search/sort page, just reached
  via the Sidebar instead of the avatar dropdown.
- **`HomeSignedIn` simplified**: now owns only the mochi-status (with rank) + suggestion
  columns — the Sidebar carries what used to be its own rail. The "supports anyone via
  holding or following" adaptive trigger from earlier the same day narrows back to **"holds
  mochi anywhere"** for the status column specifically (there's nothing money-shaped to show
  a follow-only supporter), but news still sources from held **and** followed creators, so a
  follow-only user isn't starved of updates just because the status card doesn't apply.
- **Suggestions are now single-column, larger blocks** (thumbnail + name), explicitly not
  the dense StreamerCard grid — the YouTube-Music "album block" look the owner asked for,
  distinct from the Sidebar's compact list rows for the same underlying data shape.

## 2026-07-30 — Notifications + Follow: the home rail merges paid and free support
Two new models. **`Follow`** (streamerId+backerId, unique) is a free, in-app "keep me
posted" relationship — distinct from `MochiHolding` (money) and the dormant
`Streamer.followerCount` (a Phase-1 seeded off-platform number, never rendered).
**`Notification`** (backerId, type, title/body/link, read) is queued for four events:
order fulfilled, order cancelled, a held/followed creator adds an item, a held creator
raises their mochi price.
- **The home rail now merges holdings + follows** (`getRailCreators` in `src/lib/home.ts`):
  a row shows a balance if the user holds mochi, or a 팔로잉 chip if they only follow.
  Extends the 2026-07-29 rail decision — and **changes its trigger**: the two-column
  layout now fires on "supports anyone" (holds mochi OR follows), not "holds mochi",
  because following is free and should be the low-friction way to fill the home. News
  (`getUpdatesForBacker`) sources from the same merged set.
- **Notification creation lives in `src/lib/notify.ts`, called from `studio/actions.ts`
  after the triggering mutation commits** — deliberately NOT inside mochi.ts's
  transactions. `notify()`/`notifyMany()` swallow their own errors: a failed insert must
  never roll back or fail the order/item/price action that triggered it. Same principle
  as keeping home.ts out of mochi.ts's tested surface.
- **Recipients**: order events notify just the buyer. A new item notifies everyone with a
  stake in the creator (holds mochi in them OR follows them — `getStakeholderBackerIds`).
  A price raise notifies holders only (`getHolderBackerIds`) — a bare follower has no
  balance at stake in the price. Editing an existing item never re-notifies (only the
  create branch of `upsertItem` fires it), so a typo fix doesn't spam stakeholders.
- **UI**: a bell in `Nav` (consumer host only, mirroring 홈/내 모찌) with an unread-count
  badge and a dropdown of the latest 6, plus a full `/notifications` page (mark-all-read,
  mark-on-click). `FollowButton` on the profile header is a free toggle beside the paid
  모찌 보내기 CTA — optimistic, reverts on failure, hidden for signed-out visitors (signup
  happens through the buy-mochi CTA, not here).
- **Home widened 1440 → 1600** to match `Nav`'s own max-width (they'd drifted apart);
  feed grids gained a `2xl` column so the extra width holds more cards, not more padding.

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
> per-tier availability and the price ratchets up. **"unspent-refundable" below is
> superseded twice**: flat non-refundable at 2026-08-01, then narrowed again at
> **2026-08-06** to the shipped policy (7-day 청약철회 on a wholly unused purchase, 잔액
> 환불 past 60% use, plus the 법령 carve-out) — see `/refund`. The "not a security" stance
> below still holds: the surviving refund paths all return **at the price paid**, so there
> is still no buy-low-refund-high path.

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

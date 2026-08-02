# motoo — Progress Tracker

_Last updated: 2026-08-01_

Living status of the build. Update the checkboxes as work lands. See
[`DECISIONS.md`](./DECISIONS.md) for why things are the way they are and
[`DEPLOYMENT.md`](./DEPLOYMENT.md) for infra state.

## Recent — 2026-08-02 (logout actually revokes the session)

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

## Recent — 2026-08-02 (Studio pill gate + creator-setup heading)

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

## Recent — 2026-08-01 (creator status badge)

- [x] **`크리에이터 등록 완료`** — new shared `CreatorBadge`, shown in the nav's avatar
  dropdown and on `/profile` for accounts that own a Studio. Additive accounts meant nothing
  on either surface said you were a creator. Keyed off `session.user.creator` (already in the
  JWT), copy in `common`. See DECISIONS 2026-08-01.
- [x] Verified: `tsc`, `check:vocab`, `check:emoji` clean, eslint unchanged, `pnpm test`
  11/11, `pnpm build` clean. Browser-checked both account types — the creator gets the badge
  in both places, the fan gets it in neither, no page errors.

## Recent — 2026-08-01 (uploads, non-refundable mochi, creator-page layout, Studio landing)

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

## Recent — 2026-08-01 (signup-flow fixes + 백커 → 팬)

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

## Recent — 2026-08-01 (Studio nav: added a "motoo" pill back to the consumer app)

- [x] **Studio host's nav now has a `backToMotoo` pill**, same style/position as the
  consumer nav's Studio pill, mirrored the other direction — one click from
  `studio.themotoo.com` back to `/home` on the apex. Both hosts share one `Nav` component;
  no separate Studio nav to maintain. Ranking/notification icons deliberately not added to
  the Studio side — those are consumer-only concepts (creators don't receive
  notifications). See DECISIONS 2026-08-01.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean, browser-tested on `studio.localhost` (pill renders, click reaches
  `/home` content) and confirmed the real consumer host's nav is unaffected.

## Recent — 2026-08-01 (Trust Report removed — not part of 1.0.0)

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

## Recent — 2026-08-01 (Buy Mochi → own page; Backer Wall → real supporter ranking)

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

## Recent — 2026-07-31 (unified page width + heading style across the app)

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

## Recent — 2026-07-31 (fixed collapsed-rail border line stopping short)

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

## Recent — 2026-07-31 (both rails are now foldable, state persists)

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

## Recent — 2026-07-31 (fixed invisible nav hover/active box)

- [x] **`bg-panel` was invisible against the page**: `--color-panel` is the exact same hex
  as `--color-cream` (page background), so every nav hover/active box (Sidebar links,
  following-list rows, Nav's ranking icon, NotificationBell) rendered with zero contrast.
  Switched those specifically to `bg-cream-warm` (already used this way by `UserMenu`'s
  dropdown rows) — left the `panel` token itself alone since ~20 other places rely on it
  matching the page background on purpose (inset panels on white cards). See DECISIONS
  2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked the hover box now visibly appears.

## Recent — 2026-07-31 (compass icon fix + Sidebar active-page state)

- [x] **`IconCompass` fixed for real**: the needle path was asymmetric about the circle's
  center (not just small), causing one tip to nearly touch the circle edge. Replaced with
  properly-centered coordinates, verified by rendering it standalone at 200px.
- [x] **Sidebar nav shows the active page**: 홈/둘러보기 now highlight (accent color +
  panel background) when you're on that page, via a new client component
  (`SidebarNavLinks.tsx`) using `usePathname()`. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked both active states on `/home`/`/explore`.

## Recent — 2026-07-31 (RightRail: two-up grid + instant Follow)

- [x] **`RightRail` redesigned**: `grid-cols-2` (was single column), thumbnails shrunk
  90px tall (was 140px), and a compact `FollowButton` added under each card so a fan can
  follow a discovered creator without leaving the rail. `StreamerCard` gained an `id`
  field (needed by `toggleFollow`); `FollowButton` gained a `compact` size variant.
  `toggleFollow`'s revalidation widened to every ConsumerShell page, not just
  `/s/[handle]` and `/home`. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (23 routes), browser-checked the new grid + follow buttons.

## Recent — 2026-07-31 (nav icon sizing + `IconStudio` redraw)

- [x] **Enlarged nav/sidebar icons** and **redrew `IconStudio`** (was a genuine rendering
  bug — malformed disconnected "flap" path, play-triangle collapsed to a round blob under
  the shared stroke style — not just too small). Nav ranking/bell buttons `h-9 w-9`→
  `h-10 w-10` (icons `19→23`), Studio pill icon `16→20`, notification badge enlarged and
  repositioned, Sidebar `IconHome`/`IconCompass` `18→22`. See DECISIONS 2026-07-31.
- [x] Verified: `tsc`, eslint, `check:vocab`, `check:emoji` clean, `pnpm test` 11/11,
  `pnpm build` clean (25 routes), zoomed before/after screenshots confirmed the fix.

## Recent — 2026-07-31 (true edge alignment + universal rail, no exceptions)

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

## Recent — 2026-07-31 (Spotify-referenced sections, corrected to bare · local only, not yet deployed)

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
5. **Next** — design tier 2/3: the landing still repeats one section template five times, Latin eyebrows (`DISCOVER`, `HOW MOCHI WORKS`), English `STRONG`/`EMERGING` badges, unstyled native `<select>`s on explore, and leftover Phase-1 vocabulary (퍼크) still on explore
(백커 and 트러스트 리포트 are both retired now). Then real PG + real 본인인증 (both need a business registration + contract).

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

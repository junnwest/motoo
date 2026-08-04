# CLAUDE.md — start here

**motoo** is a Korean creator-support **mochi-marketplace**: each creator issues their own
mochi, users buy it and spend it in that creator's marketplace. (The original Trust Report
thesis has been removed from the website for 1.0.0 — grades/report schema stays in Prisma,
fully dormant, no remaining UI surface. See DECISIONS 2026-08-01.)

**Accounts are additive:** everyone is a **user (fan)**; a **creator** is just a user who
*also owns a Studio* (a `Streamer`). No separate account type, no mode toggle — creator
status = `session.user.creator` (their Studio handle, or null), surfaced to the user as a
**`크리에이터 등록 완료`** badge (`CreatorBadge`) in the avatar dropdown and on `/profile`. `/` is the signed-in routing
fork and the only place it lives: a **fan lands on `/home`** (a single column: mochi status
with rank, per `src/lib/ranking.ts` → affordable items → pending orders → news), a
**creator lands in the Studio** (`/studio`, forwarded to the subdomain). `/home` stays
reachable for creators — it's a default landing, not a mode. `/` is the logged-out marketing
landing and `/explore` stays the browse page. Signup forks the same way: **`/api/fan-signup`**
(후원자) clears the creator intent, **`/api/become-creator`** (크리에이터) sets it — every
role CTA must go through one of them, never straight to `/signup`, or a stale 7-day
`creatorIntent` cookie appends creator onboarding to a fan signup.
Every signed-in consumer page gets `ConsumerShell`'s two persistent
rails: a left **Sidebar** (홈/둘러보기 + the following list — Follow only, never merged with
`MochiHolding`) and a right **RightRail** (discovery suggestions, live supporter counts,
instant follow). Both are collapsible with state persisted across navigation
(`src/lib/usePersistedCollapse.ts`). A **Studio pill** in the nav (always visible) links a
creator straight to `/studio`; a fan gets a modal explaining they aren't registered as a
creator yet, with enrolling as the deliberate next step (never a silent jump into creator
setup) — mirrored on the Studio host by a **motoo pill** that routes back to the consumer app. A creator's own supporters get a live
leaderboard by lifetime mochi purchased (`getSupporterLeaderboard`, `src/lib/ranking.ts`) on
their `/s/[handle]` page; buying mochi is its own focused page, `/s/[handle]/buy`. A bell
icon surfaces `/notifications` (order/item/price events, best-effort via `src/lib/notify.ts`,
never inside `mochi.ts`'s transactions). `/profile` (identity + holdings + history) and
`/settings` (profile picture / nickname / handle / password) round out the avatar dropdown.
`/s/[handle]` is the one ConsumerShell page that **fills its column and boxes each section**
rather than using the shared 900px cap (DECISIONS 2026-08-01). New users go through
`/onboarding` (nickname, unique `@handle`, 본인인증, terms), enforced by `src/proxy.ts` (the
edge middleware).

**Two domains, one codebase:** `themotoo.com` = consumer app; **`studio.themotoo.com`** =
creator console (the `/studio` route group, served at the subdomain root). The split is
host-based routing in `src/proxy.ts`; the session cookie is shared across `.themotoo.com`
(`AUTH_COOKIE_DOMAIN`, prod only) so one login works on both. Auth/onboarding/become-creator
all live on the apex. **Adding a Studio route?** Add its path to the `isStudioPage` allowlist
in `src/proxy.ts` or it'll bounce to the apex. Consumer paths on the studio host 307 to
`PROD_CANONICAL_APEX` (**www**, not the bare apex — that would add a second redirect).
**In dev they're served inline instead**, and must stay that way: the dev apex is bare
`localhost:PORT`, which is Next's own dev binding, so a redirect there gets flattened to a
relative `Location` and loops. Dev: `studio.localhost:PORT`. See DECISIONS 2026-07-24 and
2026-08-03.

## Read these first (resume point)
- **[docs/PROGRESS.md](docs/PROGRESS.md)** — living status: what's done, in progress, next. **Start here.**
- **[docs/DECISIONS.md](docs/DECISIONS.md)** — why things are the way they are.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Vercel + Supabase (Seoul) runbook + state.
- [motoo-product-description.md](motoo-product-description.md) — original spec · [design-handoff/](design-handoff/) — visual system.

## Hard constraints
- **Not a financial product.** No investment/return vocabulary in user-facing copy (spec §2).
  Run `pnpm check:vocab` after touching copy. Mochi = prepaid marketplace credit:
  non-transferable, **non-refundable** (legally-mandated exceptions only — e.g. a minor's
  payment), no resale/return. See DECISIONS 2026-08-01.
- **Money logic is tested.** Run `pnpm test` (node:test via tsx, needs `pnpm db:up`)
  after touching `src/lib/mochi.ts` — it asserts the buy/redeem/cancel invariants
  and the concurrency guards (no oversell, no negative balance).
- Money is **integer KRW**, never floats.
- Korean-first, **no hardcoded strings** — all copy in `messages/*.json` (next-intl).
  Fans are **팬 / 후원자** — **백커 is retired** and `pnpm check:vocab` now fails on it
  (its `RETIRED` list, separate from the regulatory `STRICT` one). Korean headings/titles in
  narrow cards want `break-keep`, or Hangul wraps mid-word.
- **Auth transitions must be real navigations, never soft ones.** Two separate bugs came from
  this. *Logout*: sessions are stateless JWTs and Auth.js re-issues the session cookie on
  *every* authenticated request, so clearing the cookie alone is undone by any request still
  carrying the old one — `Backer.tokenVersion` is the real gate (bumped by `/api/logout`,
  checked in the `jwt` callback), and logout is a **native form POST**. *Login/signup*: a
  server-action `redirectTo` lets Next resolve the destination without requesting it, so the
  middleware's onboarding gate never runs — both actions return `{ ok: true }` and the form
  does `window.location.assign("/")`. Don't reintroduce a server-action redirect for either.
  See DECISIONS 2026-08-02.
- **Uploaded images are data URLs in Postgres**, not files — there is no object storage.
  `src/lib/imageUpload.ts` owns the budgets; `ImagePicker` crops/re-encodes in the browser;
  `parseImageDataUrl` is the server gate (jpeg/png/webp only — never svg — and a hard byte
  cap). Keep budgets small: avatars inline into the nav on every page. Same treatment as
  `thumbnailKey`: anything malformed becomes null rather than an error.
- **No emoji in the UI, anywhere.** Every user-visible glyph is a line icon from
  `src/components/ui/Icons.tsx`. Emoji render in the OS emoji font, so they shift per
  platform and can't take brand color. Run `pnpm check:emoji` after touching copy or
  icons. (Typographic symbols — → ← ✓ ✕ — are fine; they're punctuation, not pictographs.)

## Run locally
```bash
pnpm install
pnpm db:up && pnpm db:push && pnpm db:seed   # Postgres via docker (host port 5433)
pnpm dev                                       # http://localhost:3000
```
Dev logins: fan `demo@motoo.dev` / `motoo` (holds mochi in 4 creators, so `/home` shows its
populated state); **creator `creator@motoo.dev` / `motoo`** (a user who owns `@creatorA`).
Both land on `/home`; the creator gets a **스튜디오** nav link. `pnpm db:seed` starts with
`deleteMany()` — it wipes every account, including ones you signed up with locally. If you
need a personal account that survives reseeds, add it to `prisma/seed.ts` the way
`orangeandmustard@gmail.com` is (Kenneth's). In dev, `src/lib/session.ts` falls back to the demo fan (`getCurrentBacker`) and demo
creator (`getCurrentCreator`) when nobody's signed in. New signups are forced through
`/onboarding` before the app; existing/seeded accounts are grandfathered.

`pnpm test` (money logic), `pnpm check:vocab` (banned copy), `pnpm check:emoji`, `pnpm lint`.
Google/Naver OAuth are live in dev (`.env`, gitignored); Kakao + real 본인인증 + real PG all
need a business registration (`사업자등록`) — mocks stand in until then.

## Deploy
**Live at [themotoo.com](https://themotoo.com)** — Vercel + Supabase Pro Postgres (Seoul,
project `nrfhwhefabahsfzuyxqu`); auto-deploys on push to `main`. Secrets (DB password,
`AUTH_SECRET`, connection strings) are **not in the repo** — they live in `.env` /
`.env.production.local` (both gitignored) and Vercel env vars. See docs/DEPLOYMENT.md for
the env-var list and the runbook.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Prisma 6 + Postgres · next-intl ·
Auth.js v5 (credentials + Google/Naver live, Kakao scaffold; edge `auth.config.ts` +
Node `auth.ts` split, `src/proxy.ts` middleware) · `PaymentProvider` + `VerificationProvider`
abstractions (both `mock` in dev, swap via `PAYMENT_PROVIDER` / `VERIFICATION_PROVIDER`).

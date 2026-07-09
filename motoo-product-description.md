# motoo — Product Description

**Audience:** Coding agent
**Scope:** What motoo is and how it behaves. Visual design, branding, and UI styling are specified separately by the design agent.

---

## 1. What motoo is

motoo is a two-sided platform where fans back mid-small streamers, and where that backing is recorded as **trust data**.

On the surface, it is a fan support product: a streamer sets up backing tiers, fans back them, and fans receive perks. Underneath, motoo is accumulating a creator's verifiable track record — who backed them, who came back, whether promised rewards were actually delivered, whether the fandom grew.

That record becomes the **Streamer Trust Report**, which is the real product. A streamer can show it to brands, sponsors, MCNs, and event organizers as evidence that they are worth working with.

**The one-line version:** Existing support platforms help creators receive money. motoo turns support data into a creator's trust asset.

**What makes it different:** other platforms record *how much* was raised. motoo records *who* backed, *how many came back*, *whether the streamer delivered what they promised*, and *whether the community grew*.

---

## 2. Critical constraint: this is not a financial product

Phase 1 has **no investment, no revenue share, no returns, no securities.** Fans receive status, access, and recognition — never financial upside.

This is a regulatory requirement, not a stylistic preference. The long-term roadmap does eventually reach regulated creator finance, but nothing built now may anticipate it.

**Banned vocabulary anywhere in the product — UI, copy, API responses, database enums, metadata, marketing:**
invest, investor, investment, return, ROI, profit, dividend, share, equity, stake, yield, portfolio, 투자, 수익권, 조각투자, 배당, 원금.

**Use instead:** back, backer, support, supporter, founding backer, perk, reward, record.

Checkout must carry an explicit, unmissable disclosure before payment: backing is support, not an investment; the backer receives the listed perks; there is no financial return.

---

## 3. Users

**Fan / backer.** Wants to be recognized as an early supporter of someone they believe in. Their payoff is identity and access: a founding backer number, a place on the Backer Wall, a Discord role, early access, Q&A entry, priority on merch and meetups. Emotional, mobile-first, often young. Must never be made to feel they are buying a financial instrument.

**Streamer.** Korean, roughly 30–300 average concurrent viewers, has a Discord or fan café, has taken donations before, currently manages fans manually. Wants money, but equally wants to know who their core fans are and to have something credible to show a sponsor. Their payoff is money + fan CRM + an exportable Trust Report.

**Admin (internal).** Reviews streamer applications, monitors fulfillment, generates and approves Trust Reports. Phase 1 is deliberately manual — we need to learn which data actually matters before automating any of it.

Fan and streamer meet inside the product. Every surface is shared or adjacent, so nothing may be built that only makes sense to one of them.

---

## 4. Site structure

```
/                         Home — what motoo is, for fans and streamers
/explore                  Explore streamers (browse, filter, search)
/s/[handle]               Streamer public profile + backer wall
/s/[handle]/back          Backer checkout
/s/[handle]/report        Public Trust Report (if published)
/backer                   Backer profile — everyone you've backed, badges
/apply                    Streamer application

/dashboard                Streamer dashboard          (auth: streamer)
/dashboard/fans           Fan CRM
/dashboard/perks          Perk fulfillment tracker
/dashboard/updates        Post updates to backers
/dashboard/report         Trust Report (view, export)
/dashboard/payouts        Earnings & settlement

/admin                    Admin                       (auth: admin)
/admin/applications       Review streamer applications
/admin/reports            Generate & approve monthly Trust Reports
```

---

## 5. Core flows

**Streamer onboarding.** Apply → admin review → approval → sub-merchant account setup (business registration, bank verification) → configure tiers and perks → page goes live.

**Backing.** Fan opens streamer page → selects tier → chooses how they appear (public name / nickname / anonymous) → optionally writes a message → pays → receives a founding backer number → is recorded on the Backer Wall → receives their badge.

The founding number must be shown to the fan **before** they pay. It is the thing they are actually receiving.

**Fulfillment.** Streamer promises a perk with a due date → marks progress → marks delivery per backer → backers are notified → delivery is recorded. Overdue perks are surfaced prominently to the streamer, because they directly reduce the Execution grade.

**Reporting.** At the end of each month, metrics are snapshotted → a Trust Report is generated → an admin reviews and approves it → the streamer may publish it to their profile and export it as a PDF.

---

## 6. Page behavior

**Home.** Explains motoo to two audiences at once. Must communicate *record*, not *tip jar*. Two paths: explore streamers, or apply as a streamer. Include a real example of a Trust Report — it is the differentiator. Footer carries legal, terms, refund policy, and the Korean business information block.

**Explore.** Grid of streamer cards showing backer count, fulfillment rate, and readiness level. Filters by category, backer count, readiness. **Rank by trust signals, never by money raised** — a top-earners leaderboard would teach streamers to optimize for extraction rather than delivery.

**Streamer profile.** Bio and platform links; backing tiers with perks and per-tier backer counts; the **Backer Wall** (the emotional heart — founding numbers, names or anonymous placeholders, optional messages, paginated); recent updates, with backer-only posts locked; and a Trust Report summary if published.

**Checkout.** Tier → display preference → message → pay, with the non-financial disclosure above the pay button. On success, the founding number is revealed as a distinct moment, not a receipt line.

**Streamer dashboard.** Four headline metrics: backers (with monthly delta), recurring backing rate, perk fulfillment rate, core fan count. Below: the Trust Report summary with its five grades, a Backer Wall preview, and a "needs attention" list of overdue perks and unanswered messages.

**Fan CRM.** Table of every backer: founding number, tier, total backed, times backed, first and last backing, message rate, perk status, tags. Sortable, filterable, CSV export. Core fans (three or more backings, or top-decile engagement) are flagged. Row opens a detail view with full history, messages, delivery log, and a private note field.

**Perk fulfillment tracker.** Perks move through `Promised → In progress → Delivered`, showing tier, backers owed, due date, and days remaining or overdue. Bulk "mark delivered" for selected backers, which notifies them.

**Trust Report.** Must read as a document, not a dashboard — it is the artifact a sponsor receives. Sections and metrics:

- **Fan support** — total backers · average backing · recurring rate
- **Fan loyalty** — core fan count · public backer ratio · message rate · update response rate
- **Execution** — perk fulfillment rate · update frequency · overdue perk count
- **Growth** — follower growth · average viewer growth · community growth
- **Sponsor readiness** — overall grade

Grades are `Emerging` / `Strong` / `Excellent`. Never a number, never a letter, never a score out of 100 — a numeric score invites gaming and implies a precision the data doesn't have.

Actions: publish to profile (toggle), export PDF. The PDF is emailed to sponsors, so it must be print-clean at A4. Web and PDF render from the same component.

**Admin.** Application queue with approve/reject and reason. Report queue: preview, adjust, approve, publish. Fulfillment monitoring across all streamers. Manual override on every computed grade, with an audit log of who changed what and when.

---

## 7. Data model

```ts
Streamer {
  id, handle, displayName, avatarUrl, bio, category,
  platformLinks: { chzzk?, soop?, youtube?, twitch? },
  discordUrl?, fanCafeUrl?,
  status: 'pending' | 'approved' | 'suspended',
  subMerchantId,
  avgViewers, followerCount,
  createdAt, approvedAt
}

Tier {
  id, streamerId, name, priceKrw, description,
  perks: Perk[], backerCount, limit?, active
}

Backing {
  id, streamerId, backerId, tierId,
  amountKrw, currencyUnitsSpent,
  foundingNumber,
  display: 'public' | 'nickname' | 'anonymous',
  displayName?, message?,
  status: 'paid' | 'refunded' | 'failed',
  createdAt
}

Backer {
  id, email, nickname, avatarUrl?,
  currencyBalance,
  ageVerified, guardianConsent?,
  createdAt
}

Perk {
  id, tierId, streamerId, title, description,
  promisedBy: date,
  status: 'promised' | 'in_progress' | 'delivered',
  deliveredAt?, backersOwed: number
}

PerkDelivery {
  id, perkId, backingId, deliveredAt, confirmedByBacker: boolean
}

Update {
  id, streamerId, title, body,
  visibility: 'public' | 'backers' | 'tier',
  tierId?, publishedAt, viewCount, reactionCount
}

TrustReport {
  id, streamerId, reportNumber, periodStart, periodEnd,
  metrics: { fanSupport, fanLoyalty, execution, growth },
  grades:  { fanSupport, fanLoyalty, execution, growth, sponsorReadiness },
  status: 'draft' | 'approved' | 'published',
  approvedBy?, generatedAt, publishedAt
}
```

**Invariants**

`foundingNumber` is assigned once per (streamer, backer) pair on first backing. Never reused, never reordered, never changed. Refunds do not release the number. It is the product's core promise to the fan.

`PerkDelivery` rows — not `Perk.status` — are the source of truth for the Execution grade. A perk counts as fulfilled only to the extent that individual backers actually received it. This is more work to build, and it is the entire reason the Trust Report means anything to a sponsor.

Trust Report metrics are snapshotted at generation. A published report is never recomputed.

---

## 8. Payments

This is a Korean-market product. **Stripe does not apply.**

**Virtual currency model.** Backers purchase a virtual currency ("cookies") in fixed packs, then spend cookies to back a streamer at a tier. This follows the 별풍선 pattern: a prepaid consumable good, not a deposit and not a security. It keeps motoo clear of 유사수신 exposure.

- Cookies are non-transferable between users.
- Cookies are non-refundable once spent, subject to the statutory cooling-off period for unspent balances.
- Cookies confer no financial rights of any kind.
- Unspent balance must be visible to the user at all times and refundable under Korean e-commerce law.

**Settlement.** Funds route through a **licensed Korean PG** directly to **streamer sub-merchant accounts**. motoo is not a party holding backer funds. Do not build a wallet that holds streamer earnings on motoo's balance sheet. Sub-merchant onboarding (business registration, bank verification) happens during the streamer application flow.

**Legal requirements.** Business information footer, terms of service, refund and cancellation policy, cooling-off disclosure at purchase, receipt support (현금영수증).

**Minors.** Age verification is required before any purchase. Under-19 backers require verified guardian consent, and cookie purchases are capped. Build the gate before checkout, not after. High-value donations by minors are the single largest legal and reputational risk in Korean streaming.

---

## 9. Stack

- Next.js (App Router), TypeScript, Tailwind. Consume design tokens from the design agent; do not invent styling.
- Postgres + Prisma. Money stored as integer KRW. Never floats.
- Auth: email plus OAuth (Naver, Kakao, Google). Roles: `backer`, `streamer`, `admin`.
- Payments: Korean PG with sub-merchant support (Toss Payments / NICE / KG이니시스). Abstract behind a `PaymentProvider` interface.
- PDF: server-rendered from the same React component as the web report.
- i18n: `ko` default, `en` secondary. No hardcoded strings. The banned-vocabulary rule in §2 applies with more force in Korean, where 투자 / 수익권 / 조각투자 carry direct regulatory meaning.

---

## 10. Quality floor

Responsive to 360px — the fan side is overwhelmingly mobile. Visible keyboard focus. `prefers-reduced-motion` respected. Semantic HTML: the Backer Wall is a list, the Trust Report is a table. AA contrast minimum. Empty states and error states designed rather than defaulted — errors say what happened and how to fix it, empty states invite action. Optimistic UI on perk marking, with rollback on failure. An action keeps the same name through the whole flow: a button labeled "Back this streamer" produces a confirmation that says "Backed."

---

## 11. Out of scope for v1

Discord integration · platform API integration (Chzzk, SOOP) · public backer profiles · brand matching · automated growth tracking · fan reputation score · any form of advance, financing, or revenue-based product.

Build the record first. Everything on the long roadmap — sponsor matching, revenue-based advances, eventually regulated creator finance — depends on the record being real, complete, and trusted, and on nothing in Phase 1 having quietly turned motoo into a financial institution.

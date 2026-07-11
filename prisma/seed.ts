import {
  PrismaClient,
  BackingDisplay,
  MarketplaceItemType,
} from "@prisma/client";
import { computeGrades, type TrustMetrics } from "../src/lib/grades";
import { hashPassword } from "../src/lib/password";
import { MOCHI_TO_KRW } from "../src/lib/payments/types";

const prisma = new PrismaClient();

/** Deterministic pseudo-random so seeds are stable across runs. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const NICKNAMES = [
  "달빛토끼", "코딩하는곰", "야옹이팬", "첫줄러", "모찌사랑", "새벽감성",
  "라이브고정", "응원단장", "조용한후원", "단골1호", "치즈맛", "밤샘시청",
  "포근포근", "하트뿅", "겜생겜사", "노래좋아", "버추얼덕후", "공부방지기",
  "커피한잔", "별헤는밤",
];

const CATEGORIES = ["game", "music", "virtual", "daily", "study"];

interface StreamerSeed {
  handle: string;
  displayName: string;
  category: string;
  bio: string;
  avgViewers: number;
  followerCount: number;
  backers: number; // how many distinct backers to generate
  recurringRate: number; // fraction who back more than once
  fulfillment: number; // perk fulfillment 0..1
  publish: boolean; // publish a trust report
}

const STREAMERS: StreamerSeed[] = [
  { handle: "creatorA", displayName: "크리에이터A", category: "virtual", bio: "매주 화·목·토 라이브. 따뜻한 버추얼 방송을 해요.", avgViewers: 120, followerCount: 8400, backers: 42, recurringRate: 0.41, fulfillment: 0.94, publish: true },
  { handle: "creatorC", displayName: "크리에이터C", category: "music", bio: "매주 화·목·토 라이브 음악 방송. 따뜻한 커뮤니티예요.", avgViewers: 240, followerCount: 15200, backers: 55, recurringRate: 0.38, fulfillment: 0.9, publish: true },
  { handle: "creatorE", displayName: "크리에이터E", category: "virtual", bio: "버추얼 게임 방송. 같이 웃고 떠들어요.", avgViewers: 300, followerCount: 21000, backers: 38, recurringRate: 0.33, fulfillment: 0.86, publish: false },
  { handle: "creatorB", displayName: "크리에이터B", category: "daily", bio: "잔잔한 일상 브이로그와 수다 방송.", avgViewers: 80, followerCount: 3200, backers: 21, recurringRate: 0.29, fulfillment: 0.78, publish: false },
  { handle: "creatorD", displayName: "크리에이터D", category: "game", bio: "FPS·공포게임 위주. 리액션 맛집.", avgViewers: 180, followerCount: 9800, backers: 33, recurringRate: 0.35, fulfillment: 0.88, publish: true },
  { handle: "creatorF", displayName: "크리에이터F", category: "study", bio: "함께 공부하는 스터디윗미 방송.", avgViewers: 60, followerCount: 2100, backers: 14, recurringRate: 0.22, fulfillment: 0.7, publish: false },
  { handle: "creatorG", displayName: "크리에이터G", category: "music", bio: "어쿠스틱 커버와 자작곡 라이브.", avgViewers: 140, followerCount: 6700, backers: 27, recurringRate: 0.31, fulfillment: 0.82, publish: false },
  { handle: "creatorH", displayName: "크리에이터H", category: "game", bio: "인디게임 탐험가. 숨은 명작 발굴.", avgViewers: 95, followerCount: 4100, backers: 19, recurringRate: 0.26, fulfillment: 0.75, publish: false },
];

const TIER_TEMPLATES = [
  { name: "새싹 응원", priceKrw: 3000, description: "가볍게 마음을 전하는 첫 응원", perks: ["백커 월 등록", "파운딩 배지"] },
  { name: "단골 서포터", priceKrw: 6000, description: "단골 팬만의 혜택을 누려요", perks: ["백커 전용 소식", "디스코드 서포터 역할", "월간 추첨 참여"] },
  { name: "핵심 팬", priceKrw: 12000, description: "가장 가까이에서 함께하는 핵심 팬", perks: ["Q&A 우선 참여", "손편지·굿즈 우선권", "비공개 라이브 초대"] },
];

// Phase 2: each creator's marketplace items, priced in that creator's mochi.
const ITEM_TEMPLATES: {
  title: string;
  description: string;
  priceMochi: number;
  itemType: MarketplaceItemType;
  stock: number | null;
}[] = [
  { title: "실시간 샤라웃", description: "방송 중에 닉네임을 불러드려요.", priceMochi: 3, itemType: "digital", stock: null },
  { title: "노래 신청", description: "다음 라이브에서 원하는 곡을 불러드려요.", priceMochi: 5, itemType: "digital", stock: null },
  { title: "멤버 전용 포스트", description: "비공개 소식과 사진을 받아보세요.", priceMochi: 10, itemType: "access", stock: null },
  { title: "손편지", description: "정성껏 쓴 손편지를 보내드려요.", priceMochi: 30, itemType: "physical", stock: 20 },
  { title: "1:1 통화 5분", description: "짧은 통화로 가깝게 인사해요.", priceMochi: 50, itemType: "session", stock: 5 },
];

async function main() {
  console.log("Resetting data…");
  // Phase 2 tables first (FKs point at streamer/backer/item).
  await prisma.order.deleteMany();
  await prisma.marketplaceItem.deleteMany();
  await prisma.mochiHolding.deleteMany();
  await prisma.mochiIssuance.deleteMany();
  await prisma.perkDelivery.deleteMany();
  await prisma.foundingMembership.deleteMany();
  await prisma.backing.deleteMany();
  await prisma.perk.deleteMany();
  await prisma.update.deleteMany();
  await prisma.trustReport.deleteMany();
  await prisma.tier.deleteMany();
  await prisma.streamer.deleteMany();
  await prisma.backer.deleteMany();

  // A pool of backers reused across streamers (so "core fans" can back several).
  console.log("Creating backers…");
  const devHash = hashPassword("motoo");
  // Seeded accounts are grandfathered as already-onboarded + verified, so the
  // onboarding middleware doesn't force them through /onboarding.
  const grandfathered = {
    onboardedAt: new Date("2026-06-01"),
    termsAgreedAt: new Date("2026-06-01"),
    verifiedAt: new Date("2026-06-01"),
    verifiedName: "홍길동",
    birthYear: 1997,
    ageVerified: true,
  };
  const backers = [];
  for (let i = 0; i < 60; i++) {
    const nickname = `${pick(NICKNAMES)}${i}`;
    backers.push(
      await prisma.backer.create({
        data: {
          email: `fan${i}@motoo.dev`,
          nickname,
          currencyBalance: 200 + Math.floor(rand() * 400),
          passwordHash: devHash,
          ...grandfathered,
          gender: pick(["female", "male", "other", "undisclosed"] as const),
        },
      }),
    );
  }
  // A known dev login: demo@motoo.dev / motoo
  const demo = await prisma.backer.create({
    data: {
      email: "demo@motoo.dev",
      nickname: "데모후원자",
      handle: "demo_fan",
      currencyBalance: 500,
      passwordHash: devHash,
      role: "backer",
      ...grandfathered,
      gender: "female",
    },
  });
  backers.push(demo);
  // Admin account
  await prisma.backer.create({
    data: {
      email: "admin@motoo.dev",
      nickname: "관리자",
      passwordHash: devHash,
      role: "admin",
      ...grandfathered,
    },
  });

  // Demo creator account. In the additive model this is just a USER who owns a
  // Studio (the flagship @creatorA), so it can browse/buy as a fan AND open the
  // Studio. Login: creator@motoo.dev / motoo
  const creatorAccount = await prisma.backer.create({
    data: {
      email: "creator@motoo.dev",
      nickname: "크리에이터A",
      passwordHash: devHash,
      ...grandfathered,
      gender: "female",
    },
  });

  // Captured for post-loop holdings/orders so the flagship demo looks alive.
  let flagship: {
    streamerId: string;
    items: { id: string; priceMochi: number }[];
  } | null = null;

  for (const s of STREAMERS) {
    console.log(`Creating streamer @${s.handle}…`);
    const isFlagship = s.handle === "creatorA";
    const streamer = await prisma.streamer.create({
      data: {
        handle: s.handle,
        displayName: s.displayName,
        bio: s.bio,
        category: s.category,
        creatorType: pick(["버추얼 스트리머", "게임 스트리머", "음악", "일상"]),
        status: "approved",
        avgViewers: s.avgViewers,
        followerCount: s.followerCount,
        approvedAt: new Date("2026-01-15"),
        subMerchantId: `sub_${s.handle}`,
        chzzk: `https://chzzk.naver.com/${s.handle}`,
        discordUrl: `https://discord.gg/${s.handle}`,
        ownerId: isFlagship ? creatorAccount.id : null,
      },
    });

    // Phase 2: mochi issuance + marketplace items for this creator.
    const pricePerMochiKrw = pick([100, 150, 200, 300]);
    const goalQuantity = pick([100, 150, 200, 300]);
    const itemCount = 3 + Math.floor(rand() * 3); // 3–5 items
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      const tpl = ITEM_TEMPLATES[i];
      const redeemedCount = Math.floor(rand() * 4);
      const item = await prisma.marketplaceItem.create({
        data: {
          streamerId: streamer.id,
          title: tpl.title,
          description: tpl.description,
          priceMochi: tpl.priceMochi,
          itemType: tpl.itemType,
          stock: tpl.stock,
          redeemedCount,
          sortOrder: i,
        },
      });
      items.push(item);
    }
    // soldQuantity: seed some progress toward the soft goal.
    const soldQuantity = Math.round(goalQuantity * (0.2 + rand() * 0.5));
    await prisma.mochiIssuance.create({
      data: {
        streamerId: streamer.id,
        pricePerMochiKrw,
        goalQuantity,
        soldQuantity,
        active: true,
      },
    });
    if (isFlagship) {
      flagship = {
        streamerId: streamer.id,
        items: items.map((it) => ({ id: it.id, priceMochi: it.priceMochi })),
      };
    }

    // Tiers
    const tiers = [];
    for (let t = 0; t < TIER_TEMPLATES.length; t++) {
      const tpl = TIER_TEMPLATES[t];
      tiers.push(
        await prisma.tier.create({
          data: {
            streamerId: streamer.id,
            name: tpl.name,
            priceKrw: tpl.priceKrw,
            description: tpl.description,
            sortOrder: t,
          },
        }),
      );
    }

    // Perks (one per tier), with due dates spread around now.
    const perks = [];
    for (let t = 0; t < tiers.length; t++) {
      const perk = await prisma.perk.create({
        data: {
          tierId: tiers[t].id,
          streamerId: streamer.id,
          title: TIER_TEMPLATES[t].perks[0],
          description: `${tiers[t].name} 백커에게 제공되는 퍼크`,
          promisedBy: new Date(2026, 5 + t, 20),
          status: t === 0 ? "delivered" : t === 1 ? "in_progress" : "promised",
          backersOwed: 0,
        },
      });
      perks.push(perk);
    }

    // Backings — assign founding numbers sequentially per streamer.
    let foundingCounter = 0;
    const backerFounding = new Map<string, number>();
    const tierBackerCounts = [0, 0, 0];
    let totalKrw = 0;
    let deliveredCount = 0;
    let owedCount = 0;

    // choose a subset of the backer pool for this streamer
    const shuffled = [...backers].sort(() => rand() - 0.5).slice(0, s.backers);
    for (const backer of shuffled) {
      const timesToBack = rand() < s.recurringRate ? 1 + Math.floor(rand() * 3) : 1;
      for (let b = 0; b < timesToBack; b++) {
        const tierIndex =
          rand() < 0.5 ? 0 : rand() < 0.75 ? 1 : 2;
        const tier = tiers[tierIndex];
        tierBackerCounts[tierIndex]++;

        // founding number: assigned once per (streamer, backer)
        let founding = backerFounding.get(backer.id);
        if (founding === undefined) {
          founding = ++foundingCounter;
          backerFounding.set(backer.id, founding);
          await prisma.foundingMembership.create({
            data: {
              streamerId: streamer.id,
              backerId: backer.id,
              foundingNumber: founding,
            },
          });
        }

        const display = pick([
          BackingDisplay.public,
          BackingDisplay.public,
          BackingDisplay.nickname,
          BackingDisplay.anonymous,
        ]);
        const hasMessage = rand() < 0.4;
        const mochi = tier.priceKrw / MOCHI_TO_KRW;
        totalKrw += tier.priceKrw;

        const backing = await prisma.backing.create({
          data: {
            streamerId: streamer.id,
            backerId: backer.id,
            tierId: tier.id,
            amountKrw: tier.priceKrw,
            currencyUnitsSpent: mochi,
            foundingNumber: founding,
            display,
            displayName:
              display === BackingDisplay.nickname
                ? `${backer.nickname}💛`
                : null,
            message: hasMessage
              ? pick([
                  "항상 응원해요! 오래오래 방송해주세요 🙌",
                  "덕분에 하루가 즐거워요.",
                  "첫 방송부터 지금까지 쭉 함께했어요.",
                  "다음 콘텐츠도 기대할게요!",
                  "힘내세요, 우리가 있잖아요 💪",
                ])
              : null,
            status: "paid",
            createdAt: new Date(
              2026,
              1 + Math.floor(rand() * 5),
              1 + Math.floor(rand() * 27),
            ),
          },
        });

        // Perk delivery — only for the delivered (tier 0) perk, at the fulfillment rate.
        if (tierIndex === 0) {
          owedCount++;
          if (rand() < s.fulfillment) {
            deliveredCount++;
            await prisma.perkDelivery.create({
              data: {
                perkId: perks[0].id,
                backingId: backing.id,
                confirmedByBacker: rand() < 0.7,
              },
            });
          }
        }
      }
    }

    // Update tier backer counts + perk owed counts
    for (let t = 0; t < tiers.length; t++) {
      await prisma.tier.update({
        where: { id: tiers[t].id },
        data: { backerCount: tierBackerCounts[t] },
      });
    }
    await prisma.perk.update({
      where: { id: perks[0].id },
      data: { backersOwed: owedCount, deliveredAt: new Date(2026, 5, 18) },
    });

    // Updates
    await prisma.update.createMany({
      data: [
        {
          streamerId: streamer.id,
          title: "이번 달 목표 달성 감사합니다!",
          body: "여러분 덕분에 이번 달 목표를 달성했어요. 다음 달엔 더 좋은 콘텐츠로 찾아올게요.",
          visibility: "public",
          publishedAt: new Date(2026, 5, 25),
          viewCount: 1200,
          reactionCount: 210,
        },
        {
          streamerId: streamer.id,
          title: "[백커 전용] 다음 오프라인 모임 안내",
          body: "핵심 팬 여러분을 위한 오프라인 모임을 준비 중이에요. 곧 자세히 안내드릴게요!",
          visibility: "backers",
          publishedAt: new Date(2026, 5, 28),
          viewCount: 320,
          reactionCount: 88,
        },
      ],
    });

    // Trust report (published for some)
    const totalBackers = backerFounding.size;
    const totalBackings = tierBackerCounts.reduce((a, b) => a + b, 0);
    const recurringRate =
      totalBackers > 0 ? (totalBackings - totalBackers) / totalBackings : 0;
    const coreFanCount = Math.round(totalBackers * 0.15);
    const perkFulfillmentRate = owedCount > 0 ? deliveredCount / owedCount : 1;

    const metrics: TrustMetrics = {
      fanSupport: {
        totalBackers,
        averageBackingKrw:
          totalBackings > 0 ? Math.round(totalKrw / totalBackings) : 0,
        recurringRate,
      },
      fanLoyalty: {
        coreFanCount,
        publicBackerRatio: 0.55 + rand() * 0.2,
        messageRate: 0.3 + rand() * 0.2,
        updateResponseRate: 0.4 + rand() * 0.3,
      },
      execution: {
        perkFulfillmentRate,
        updateFrequencyPerMonth: 4,
        overduePerkCount: s.fulfillment < 0.8 ? 1 : 0,
      },
      growth: {
        followerGrowth: 0.05 + rand() * 0.15,
        avgViewerGrowth: 0.03 + rand() * 0.12,
        communityGrowth: 0.06 + rand() * 0.14,
      },
    };
    const grades = computeGrades(metrics);

    await prisma.trustReport.create({
      data: {
        streamerId: streamer.id,
        reportNumber: 1,
        periodStart: new Date(2026, 5, 1),
        periodEnd: new Date(2026, 5, 30),
        metrics: metrics as unknown as object,
        grades: grades as unknown as object,
        status: s.publish ? "published" : "draft",
        publishedAt: s.publish ? new Date(2026, 6, 1) : null,
        generatedAt: new Date(2026, 6, 1),
      },
    });
  }

  // ── Phase 2: populate the flagship creator's holdings + orders ──────────────
  if (flagship) {
    console.log("Seeding flagship mochi holdings + orders…");
    // Demo backer holds mochi for the flagship (so "My mochi" isn't empty).
    await prisma.mochiHolding.create({
      data: {
        streamerId: flagship.streamerId,
        backerId: demo.id,
        balance: 42,
        purchasedTotal: 60,
      },
    });

    // A handful of pool fans hold mochi too (so the dashboard shows real holders).
    const holders = backers.filter((b) => b.id !== demo.id).slice(0, 9);
    for (const b of holders) {
      const purchased = 10 + Math.floor(rand() * 40);
      await prisma.mochiHolding.create({
        data: {
          streamerId: flagship.streamerId,
          backerId: b.id,
          balance: Math.floor(purchased * (0.3 + rand() * 0.6)),
          purchasedTotal: purchased,
        },
      });
    }

    // A few orders across statuses so the orders view is populated.
    const orderBuyers = [demo, ...holders.slice(0, 4)];
    const notes = [
      "다음 방송에서 불러주세요!",
      "생일 축하 샤라웃 부탁드려요 🎂",
      null,
      "응원합니다, 오래오래 방송해주세요.",
      null,
    ];
    for (let i = 0; i < orderBuyers.length; i++) {
      const item = pick(flagship.items);
      const status = i === 0 ? "pending" : i < 3 ? "fulfilled" : "pending";
      await prisma.order.create({
        data: {
          streamerId: flagship.streamerId,
          backerId: orderBuyers[i].id,
          itemId: item.id,
          mochiSpent: item.priceMochi,
          quantity: 1,
          note: notes[i],
          status: status as "pending" | "fulfilled",
          fulfilledAt: status === "fulfilled" ? new Date(2026, 6, 5 + i) : null,
          createdAt: new Date(2026, 6, 2 + i),
        },
      });
    }
  }

  console.log(
    "Seed complete ✅  (fan login: demo@motoo.dev / motoo · creator login: creator@motoo.dev / motoo)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import {
  PrismaClient,
  MarketplaceItemType,
  FulfillmentMode,
} from "@prisma/client";
import { hashPassword } from "../src/lib/password";

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

interface StreamerSeed {
  handle: string;
  displayName: string;
  creatorType: string; // primary facet: streamer | youtuber | author
  category: string; // sub-facet, must belong to the creatorType
  bio: string;
  avgViewers: number;
  followerCount: number;
  backers: number; // how many distinct backers to generate
  recurringRate: number; // fraction who back more than once
  fulfillment: number; // perk fulfillment 0..1
  publish: boolean; // publish a trust report
}

const STREAMERS: StreamerSeed[] = [
  { handle: "creatorA", displayName: "별하루", creatorType: "streamer", category: "virtual", bio: "매주 화·목·토 라이브. 따뜻한 버추얼 방송을 해요.", avgViewers: 120, followerCount: 8400, backers: 42, recurringRate: 0.41, fulfillment: 0.94, publish: true },
  { handle: "creatorC", displayName: "밤편지라디오", creatorType: "streamer", category: "music", bio: "매주 화·목·토 라이브 음악 방송. 따뜻한 커뮤니티예요.", avgViewers: 240, followerCount: 15200, backers: 55, recurringRate: 0.38, fulfillment: 0.9, publish: true },
  { handle: "creatorE", displayName: "코코넛토끼", creatorType: "streamer", category: "virtual", bio: "버추얼 게임 방송. 같이 웃고 떠들어요.", avgViewers: 300, followerCount: 21000, backers: 38, recurringRate: 0.33, fulfillment: 0.86, publish: false },
  { handle: "creatorB", displayName: "소소한하루", creatorType: "youtuber", category: "vlog", bio: "잔잔한 일상 브이로그와 수다 영상.", avgViewers: 80, followerCount: 3200, backers: 21, recurringRate: 0.29, fulfillment: 0.78, publish: false },
  { handle: "creatorD", displayName: "불꽃여우", creatorType: "streamer", category: "game", bio: "FPS·공포게임 위주. 리액션 맛집.", avgViewers: 180, followerCount: 9800, backers: 33, recurringRate: 0.35, fulfillment: 0.88, publish: true },
  { handle: "creatorF", displayName: "새벽공부방", creatorType: "streamer", category: "study", bio: "함께 공부하는 스터디윗미 방송.", avgViewers: 60, followerCount: 2100, backers: 14, recurringRate: 0.22, fulfillment: 0.7, publish: false },
  { handle: "creatorG", displayName: "어쿠스틱민", creatorType: "youtuber", category: "music", bio: "어쿠스틱 커버와 자작곡 영상.", avgViewers: 140, followerCount: 6700, backers: 27, recurringRate: 0.31, fulfillment: 0.82, publish: false },
  { handle: "creatorH", displayName: "픽셀탐험대", creatorType: "youtuber", category: "game", bio: "인디게임 탐험가. 숨은 명작 발굴.", avgViewers: 95, followerCount: 4100, backers: 19, recurringRate: 0.26, fulfillment: 0.75, publish: false },
  { handle: "creatorI", displayName: "만두작가", creatorType: "author", category: "webtoon", bio: "주 2회 연재하는 일상 웹툰 작가예요.", avgViewers: 0, followerCount: 5300, backers: 24, recurringRate: 0.34, fulfillment: 0.85, publish: true },
  { handle: "creatorJ", displayName: "달빛서고", creatorType: "author", category: "novel", bio: "판타지 장편소설을 연재하고 있어요.", avgViewers: 0, followerCount: 2800, backers: 12, recurringRate: 0.25, fulfillment: 0.72, publish: false },
];

// Phase 2: each creator's marketplace items, priced in that creator's mochi.
/** Public creator posts. Varied so the home's aggregated 소식 grid isn't 4 copies. */
const PUBLIC_UPDATES: { title: string; body: string }[] = [
  {
    title: "이번 달 목표 달성 감사합니다!",
    body: "여러분 덕분에 이번 달 목표를 달성했어요. 다음 달엔 더 좋은 콘텐츠로 찾아올게요.",
  },
  {
    title: "다음 주 방송 일정 안내",
    body: "다음 주는 화·목·토 저녁 8시에 찾아뵐게요. 늦은 시간 방송도 한 번 준비 중이에요.",
  },
  {
    title: "새 마켓 아이템을 추가했어요",
    body: "여러분이 많이 물어보신 손편지와 멤버 전용 포스트를 마켓에 올려두었어요.",
  },
  {
    title: "지난 콘텐츠 비하인드 풀었어요",
    body: "편집에서 잘린 장면들을 모아 짧게 정리했어요. 재밌게 봐주시면 좋겠어요.",
  },
  {
    title: "요청 주신 곡 준비하고 있어요",
    body: "신청해주신 곡들 하나씩 연습 중이에요. 다음 방송에서 몇 곡 들려드릴게요.",
  },
  {
    title: "조용히 쉬어가는 한 주였어요",
    body: "이번 주는 목을 좀 쉬게 했어요. 걱정해주신 분들 정말 고마워요. 곧 돌아올게요.",
  },
];

const ITEM_TEMPLATES: {
  title: string;
  description: string;
  priceMochi: number;
  itemType: MarketplaceItemType;
  thumbnailKey: string;
  fulfillment: FulfillmentMode;
  stock: number | null;
}[] = [
  { title: "실시간 샤라웃", description: "방송 중에 닉네임을 불러드려요.", priceMochi: 3, itemType: "digital", thumbnailKey: "shoutout", fulfillment: "instant", stock: null },
  { title: "노래 신청", description: "다음 라이브에서 원하는 곡을 불러드려요.", priceMochi: 5, itemType: "digital", thumbnailKey: "vote", fulfillment: "request", stock: null },
  { title: "멤버 전용 포스트", description: "비공개 소식과 사진을 받아보세요.", priceMochi: 10, itemType: "access", thumbnailKey: "badge", fulfillment: "request", stock: null },
  { title: "손편지", description: "정성껏 쓴 손편지를 보내드려요.", priceMochi: 30, itemType: "physical", thumbnailKey: "letter", fulfillment: "request", stock: 20 },
  { title: "1:1 통화 5분", description: "짧은 통화로 가깝게 인사해요.", priceMochi: 50, itemType: "session", thumbnailKey: "call", fulfillment: "request", stock: 5 },
];

async function main() {
  console.log("Resetting data…");
  // Phase 2 tables first (FKs point at streamer/backer/item).
  await prisma.order.deleteMany();
  await prisma.marketplaceItem.deleteMany();
  await prisma.mochiHolding.deleteMany();
  await prisma.mochiIssuance.deleteMany();
  await prisma.update.deleteMany();
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

  // Kenneth's local dev account. `pnpm db:seed` wipes every Backer (see the
  // deleteMany() at the top), which silently dropped this account's login,
  // holdings, and follows three times in one session before it earned a seed
  // entry — restores automatically on every reseed from here on.
  // Login: orangeandmustard@gmail.com / motoo1234
  const kenneth = await prisma.backer.create({
    data: {
      email: "orangeandmustard@gmail.com",
      nickname: "creator1",
      handle: "orangemustard",
      passwordHash:
        "ecb1fa79647da2cb5cf74f6a7e619d9d:b025824cbdefe064e917bce0b88e59c99ec4b45a8cc4a682a3a8603b8772467a5b51f19a075ec80691470ffbde4bf507550e89014225ba8f7521a04cd90fc6d4",
      ...grandfathered,
    },
  });

  // Captured for post-loop holdings/orders so the flagship demo looks alive.
  type CreatorRef = {
    streamerId: string;
    handle: string;
    displayName: string;
    pricePerMochiKrw: number;
    items: { id: string; priceMochi: number }[];
  };
  let flagship: CreatorRef | null = null;
  // Every creator, so the demo fan can hold mochi in several of them — a home
  // with one balance card isn't representative of a real user.
  const allCreators: CreatorRef[] = [];

  for (const s of STREAMERS) {
    console.log(`Creating streamer @${s.handle}…`);
    const isFlagship = s.handle === "creatorA";
    const streamer = await prisma.streamer.create({
      data: {
        handle: s.handle,
        displayName: s.displayName,
        bio: s.bio,
        category: s.category,
        creatorType: s.creatorType,
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
    // Kept above the issuance floors (100원/10개/5만원): min here is 100×500.
    const pricePerMochiKrw = pick([100, 150, 200]);
    const goalQuantity = pick([500, 1000, 2000, 5000]);
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
          thumbnailKey: tpl.thumbnailKey,
          fulfillment: tpl.fulfillment,
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
        lifetimeSold: soldQuantity, // single seeded tier: lifetime == current tier
        active: true,
      },
    });
    const creatorRef: CreatorRef = {
      streamerId: streamer.id,
      handle: s.handle,
      displayName: s.displayName,
      pricePerMochiKrw,
      items: items.map((it) => ({ id: it.id, priceMochi: it.priceMochi })),
    };
    allCreators.push(creatorRef);
    if (isFlagship) {
      flagship = creatorRef;
    }

    // Updates. The public one varies per creator — the home aggregates these
    // side by side, and four identical cards read as placeholder text.
    const publicUpdate = pick(PUBLIC_UPDATES);
    await prisma.update.createMany({
      data: [
        {
          streamerId: streamer.id,
          title: publicUpdate.title,
          body: publicUpdate.body,
          visibility: "public",
          publishedAt: new Date(2026, 5, 18 + Math.floor(rand() * 10)),
          viewCount: 600 + Math.floor(rand() * 1400),
          reactionCount: 80 + Math.floor(rand() * 260),
        },
        {
          streamerId: streamer.id,
          title: "[팬 전용] 다음 오프라인 모임 안내",
          body: "핵심 팬 여러분을 위한 오프라인 모임을 준비 중이에요. 곧 자세히 안내드릴게요!",
          visibility: "backers",
          publishedAt: new Date(2026, 5, 28),
          viewCount: 320,
          reactionCount: 88,
        },
      ],
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
        krwPaidTotal: 60 * flagship.pricePerMochiKrw,
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
          krwPaidTotal: purchased * flagship.pricePerMochiKrw,
        },
      });
    }

    // The demo fan also supports three other creators, so `/home` shows a real
    // spread (balances rail, affordable items across creators) instead of one card.
    const alsoSupported = allCreators
      .filter((c) => c.streamerId !== flagship!.streamerId)
      .slice(0, 3);
    for (const c of alsoSupported) {
      const purchased = 20 + Math.floor(rand() * 40);
      await prisma.mochiHolding.create({
        data: {
          streamerId: c.streamerId,
          backerId: demo.id,
          balance: Math.floor(purchased * (0.4 + rand() * 0.5)),
          purchasedTotal: purchased,
          krwPaidTotal: purchased * c.pricePerMochiKrw,
        },
      });
    }

    // One in-flight order with another creator, so "진행 중" isn't single-creator.
    const second = alsoSupported[0];
    if (second) {
      const secondItem = pick(second.items);
      await prisma.order.create({
        data: {
          streamerId: second.streamerId,
          backerId: demo.id,
          itemId: secondItem.id,
          mochiSpent: secondItem.priceMochi,
          quantity: 1,
          note: "이번 주 안에 부탁드려요.",
          status: "pending",
          createdAt: new Date(2026, 6, 12),
        },
      });
    }

    // The demo fan also *follows* two more creators with no mochi — the rail's
    // free half (Follow), distinct from the three paid holdings above, so the
    // home shows both row kinds (a balance vs a 팔로잉 chip).
    const followedOnly = allCreators
      .filter(
        (c) =>
          c.streamerId !== flagship!.streamerId &&
          !alsoSupported.some((s) => s.streamerId === c.streamerId),
      )
      .slice(0, 2);
    for (const c of followedOnly) {
      await prisma.follow.create({
        data: { streamerId: c.streamerId, backerId: demo.id },
      });
    }
    // A few pool fans follow the flagship too, so a real "새 아이템" notification
    // (fired from the Studio) reaches more than just the demo fan.
    for (const b of holders.slice(0, 4)) {
      await prisma.follow.create({
        data: { streamerId: flagship.streamerId, backerId: b.id },
      });
    }

    // Kenneth's account: 3 holdings + 2 follows, mirroring the manual state
    // that used to get lost on every reseed.
    const kennethHoldings = [
      { handle: "creatorA", balance: 38 },
      { handle: "creatorE", balance: 25 },
      { handle: "creatorG", balance: 12 },
    ];
    for (const { handle, balance } of kennethHoldings) {
      const held = allCreators.find((c) => c.handle === handle);
      if (!held) continue;
      await prisma.mochiHolding.create({
        data: {
          streamerId: held.streamerId,
          backerId: kenneth.id,
          balance,
          purchasedTotal: balance + 15,
          krwPaidTotal: (balance + 15) * held.pricePerMochiKrw,
        },
      });
    }
    for (const handle of ["creatorC", "creatorD"]) {
      const followed = allCreators.find((c) => c.handle === handle);
      if (!followed) continue;
      await prisma.follow.create({
        data: { streamerId: followed.streamerId, backerId: kenneth.id },
      });
    }

    // Notification history for the demo fan — one per type, a mix of read and
    // unread, staggered so the bell/`/notifications` show a real timeline
    // instead of a single seeded row. `second` always exists here (10 seeded
    // creators, alsoSupported takes 3), but guarded rather than assumed.
    const newItemNotice = second
      ? {
          backerId: demo.id,
          type: "new_item" as const,
          title: `${second.displayName}님이 새 아이템을 추가했어요`,
          body: "노래 신청",
          link: `/s/${second.handle}#market`,
          read: false,
          createdAt: new Date(2026, 6, 27, 14, 5),
        }
      : null;
    await prisma.notification.createMany({
      data: [
        {
          backerId: demo.id,
          type: "order_fulfilled",
          title: `${flagship.displayName}님이 주문을 완료했어요`,
          body: "커피한잔",
          link: "/me/mochi",
          read: false,
          createdAt: new Date(2026, 6, 28, 20, 10),
        },
        ...(newItemNotice ? [newItemNotice] : []),
        {
          backerId: demo.id,
          type: "price_raised",
          title: `${flagship.displayName}님이 모찌 가격을 인상했어요`,
          body: `개당 ${flagship.pricePerMochiKrw.toLocaleString("ko-KR")}원으로 올랐어요. 보유 중인 모찌 가치는 그대로예요.`,
          link: `/s/${flagship.handle}`,
          read: true,
          createdAt: new Date(2026, 6, 20, 9, 30),
        },
        {
          backerId: demo.id,
          type: "order_cancelled",
          title: `${flagship.displayName}님이 주문을 취소하고 모찌를 환불했어요`,
          body: "실시간 샤라웃",
          link: "/me/mochi",
          read: true,
          createdAt: new Date(2026, 6, 15, 11, 0),
        },
      ],
    });

    // A few orders across statuses so the orders view is populated.
    const orderBuyers = [demo, ...holders.slice(0, 4)];
    const notes = [
      "다음 방송에서 불러주세요!",
      "생일 축하 샤라웃 부탁드려요.",
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

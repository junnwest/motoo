"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  MarketplaceItemType,
  FulfillmentMode,
  UpdateVisibility,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import { fulfillOrder, cancelOrder } from "@/lib/mochi";
import { validateIssuance } from "@/lib/issuance";
import { isThumbnailKey } from "@/lib/itemThumbnails";
import { ITEM_COVER_SPEC, parseImageDataUrl } from "@/lib/imageUpload";
import {
  notify,
  notifyMany,
  getStakeholderBackerIds,
  getHolderBackerIds,
} from "@/lib/notify";
import {
  isCreatorType,
  isCategoryForType,
  type CreatorType,
} from "@/lib/creatorTaxonomy";

/**
 * Server actions for the creator dashboard.
 *
 * Authorization rule: every action resolves the caller's own creator profile via
 * getCurrentCreator() and uses `creator.id` as the owning streamerId. A streamerId
 * is NEVER trusted from the client — a client may only reference rows it owns.
 */

type ActionResult = { ok: true } | { ok: false; error: string };

const DASHBOARD = "/studio";

const positiveInt = z.number().int().positive();

const issuanceSchema = z.object({
  pricePerMochiKrw: positiveInt,
  goalQuantity: positiveInt,
  active: z.boolean(),
});

/** Upsert this creator's mochi issuance settings (integer KRW; positive ints). */
export async function updateIssuance(input: {
  pricePerMochiKrw: number;
  goalQuantity: number;
  active: boolean;
}): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    const parsed = issuanceSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "generic" };
    const { pricePerMochiKrw, goalQuantity, active } = parsed.data;

    // Same issuance floors as creator onboarding (100원/10개/5만원). Keeps a
    // creator from dropping below the minimum via the Studio editor later.
    const issuanceError = validateIssuance(pricePerMochiKrw, goalQuantity);
    if (issuanceError) return { ok: false, error: issuanceError };

    const existing = await prisma.mochiIssuance.findUnique({
      where: { streamerId: creator.id },
      select: { pricePerMochiKrw: true },
    });

    // The bonus rate only ratchets up (fewer mochi per ₩ donated over time).
    // Lowering it is rejected. A raise opens a NEW tier: reset the tier meter
    // (grantedQuantity → 0), discarding the leftover goal at the old rate
    // (harmless — nothing was minted). Same rate = just adjust the current
    // tier's goal. Held mochi is never touched either way.
    if (existing && pricePerMochiKrw < existing.pricePerMochiKrw) {
      return { ok: false, error: "priceOnlyUp" };
    }
    const rateRaised =
      !!existing && pricePerMochiKrw > existing.pricePerMochiKrw;

    await prisma.mochiIssuance.upsert({
      where: { streamerId: creator.id },
      create: {
        streamerId: creator.id,
        pricePerMochiKrw,
        goalQuantity,
        active,
      },
      update: {
        pricePerMochiKrw,
        goalQuantity,
        active,
        ...(rateRaised ? { grantedQuantity: 0 } : {}),
      },
    });

    revalidatePath(DASHBOARD);

    // Best-effort, after the write commits — a notify() failure must never
    // undo the rate change or fail this action (see src/lib/notify.ts).
    if (rateRaised) {
      const tn = await getTranslations("notifications.push");
      const holderIds = await getHolderBackerIds(creator.id);
      await notifyMany(holderIds, {
        type: "price_raised",
        title: tn("priceRaisedTitle", { name: creator.displayName }),
        body: tn("priceRaisedBody", { price: pricePerMochiKrw }),
        link: `/s/${creator.handle}`,
      });
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

// Optional free-text link/handle field: trimmed, empties normalized to null.
const linkField = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  bio: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  creatorType: z.string().refine(isCreatorType),
  category: z.string().trim().min(1),
  chzzk: linkField,
  soop: linkField,
  youtube: linkField,
  twitch: linkField,
  discordUrl: linkField,
  fanCafeUrl: linkField,
});

/** Update this creator's public profile (identity/account fields are separate). */
export async function updateStreamerProfile(input: {
  displayName: string;
  bio?: string;
  creatorType: string;
  category: string;
  chzzk?: string;
  soop?: string;
  youtube?: string;
  twitch?: string;
  discordUrl?: string;
  fanCafeUrl?: string;
}): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    const parsed = profileSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "generic" };
    const d = parsed.data;

    // Category must belong to the chosen type (same rule as creator setup).
    if (!isCategoryForType(d.creatorType as CreatorType, d.category)) {
      return { ok: false, error: "generic" };
    }

    await prisma.streamer.update({
      where: { id: creator.id },
      data: {
        displayName: d.displayName,
        bio: d.bio,
        creatorType: d.creatorType,
        category: d.category,
        chzzk: d.chzzk,
        soop: d.soop,
        youtube: d.youtube,
        twitch: d.twitch,
        discordUrl: d.discordUrl,
        fanCafeUrl: d.fanCafeUrl,
      },
    });

    revalidatePath(DASHBOARD);
    revalidatePath(`/s/${creator.handle}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

const itemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  priceMochi: positiveInt,
  itemType: z.nativeEnum(MarketplaceItemType),
  // Curated thumbnail slug, or null for the itemType default. Unknown keys are
  // coerced to null so a stale/forged key can never persist.
  thumbnailKey: z
    .string()
    .nullable()
    .optional()
    .transform((v) => (v && isThumbnailKey(v) ? v : null)),
  // Uploaded cover photo (a small JPEG data URL). Same "coerce, never trust"
  // treatment as thumbnailKey: anything malformed or over the byte cap becomes
  // null rather than landing in the row.
  coverImage: z
    .string()
    .nullable()
    .optional()
    .transform((v) => parseImageDataUrl(v, ITEM_COVER_SPEC)),
  fulfillment: z.nativeEnum(FulfillmentMode),
  stock: positiveInt.nullable(),
  active: z.boolean(),
});

/** Create or update a marketplace item owned by this creator. */
export async function upsertItem(input: {
  id?: string;
  title: string;
  description?: string;
  priceMochi: number;
  itemType: MarketplaceItemType;
  thumbnailKey?: string | null;
  coverImage?: string | null;
  fulfillment: FulfillmentMode;
  stock: number | null;
  active: boolean;
}): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    const parsed = itemSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "generic" };
    const {
      id,
      title,
      description,
      priceMochi,
      itemType,
      thumbnailKey,
      coverImage,
      fulfillment,
      stock,
      active,
    } = parsed.data;

    if (id) {
      // Verify ownership before mutating.
      const existing = await prisma.marketplaceItem.findUnique({
        where: { id },
        select: { streamerId: true },
      });
      if (!existing || existing.streamerId !== creator.id) {
        return { ok: false, error: "generic" };
      }
      await prisma.marketplaceItem.update({
        where: { id },
        data: {
          title,
          description,
          priceMochi,
          itemType,
          thumbnailKey,
          coverImage,
          fulfillment,
          stock,
          active,
        },
      });
    } else {
      // New item is appended after the creator's current items.
      const count = await prisma.marketplaceItem.count({
        where: { streamerId: creator.id },
      });
      await prisma.marketplaceItem.create({
        data: {
          streamerId: creator.id,
          title,
          description,
          priceMochi,
          itemType,
          thumbnailKey,
          coverImage,
          fulfillment,
          stock,
          active,
          sortOrder: count,
        },
      });

      // Only a genuinely new item announces — editing an existing one (the `id`
      // branch above) would otherwise re-notify on every typo fix.
      if (active) {
        const tn = await getTranslations("notifications.push");
        const stakeholderIds = await getStakeholderBackerIds(creator.id);
        await notifyMany(stakeholderIds, {
          type: "new_item",
          title: tn("newItemTitle", { name: creator.displayName }),
          body: title,
          link: `/s/${creator.handle}#market`,
        });
      }
    }

    revalidatePath(`${DASHBOARD}/items`);
    revalidatePath(DASHBOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Delete an owned item; falls back to soft-deactivate when orders block the FK. */
export async function deleteItem(id: string): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    const existing = await prisma.marketplaceItem.findUnique({
      where: { id },
      select: { streamerId: true },
    });
    if (!existing || existing.streamerId !== creator.id) {
      return { ok: false, error: "generic" };
    }

    try {
      await prisma.marketplaceItem.delete({ where: { id } });
    } catch {
      // Items referenced by existing orders can't be hard-deleted (FK
      // constraint). Instead retire them from the market by deactivating.
      await prisma.marketplaceItem.update({
        where: { id },
        data: { active: false },
      });
    }

    revalidatePath(`${DASHBOARD}/items`);
    revalidatePath(DASHBOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Mark a pending order fulfilled (ownership enforced in fulfillOrder). */
export async function fulfill(orderId: string): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };
    const order = await fulfillOrder(orderId, creator.id);
    revalidatePath(`${DASHBOARD}/orders`);
    revalidatePath(DASHBOARD);

    // Best-effort, after the tested transaction in mochi.ts has already
    // committed — see src/lib/notify.ts.
    const [tn, item] = await Promise.all([
      getTranslations("notifications.push"),
      prisma.marketplaceItem.findUnique({
        where: { id: order.itemId },
        select: { title: true },
      }),
    ]);
    await notify({
      backerId: order.backerId,
      type: "order_fulfilled",
      title: tn("orderFulfilledTitle", { name: creator.displayName }),
      body: item?.title,
      link: "/me/mochi",
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Cancel & refund a pending order (ownership enforced in cancelOrder). */
export async function cancel(orderId: string): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };
    const order = await cancelOrder(orderId, creator.id);
    revalidatePath(`${DASHBOARD}/orders`);
    revalidatePath(DASHBOARD);

    const [tn, item] = await Promise.all([
      getTranslations("notifications.push"),
      prisma.marketplaceItem.findUnique({
        where: { id: order.itemId },
        select: { title: true },
      }),
    ]);
    await notify({
      backerId: order.backerId,
      type: "order_cancelled",
      title: tn("orderCancelledTitle", { name: creator.displayName }),
      body: item?.title,
      link: "/me/mochi",
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

const updateSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(2000),
  visibility: z.nativeEnum(UpdateVisibility),
});

/**
 * Post an update to supporters.
 *
 * The `Update` model, the queries that read it, and the cards that render it on
 * `/home` and `/s/[handle]` all already existed — the only thing missing was a
 * way for a creator to write one, so the feed could only ever show seeded rows.
 * This closes that loop, which is the retention half of the product: buying and
 * spending were both possible, but a creator had no reason to come back.
 */
export async function createUpdate(input: {
  title: string;
  body: string;
  visibility: UpdateVisibility;
}): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "generic" };
    const { title, body, visibility } = parsed.data;

    await prisma.update.create({
      data: { streamerId: creator.id, title, body, visibility },
    });

    revalidatePath(DASHBOARD);
    revalidatePath(`/s/${creator.handle}`);

    // Best-effort, after the write — same rule as every other notify() call
    // here: a failed notification must never undo the thing it announces.
    const tn = await getTranslations("notifications.push");
    const stakeholderIds = await getStakeholderBackerIds(creator.id);
    await notifyMany(stakeholderIds, {
      type: "new_update",
      title: tn("newUpdateTitle", { name: creator.displayName }),
      body: title,
      link: `/s/${creator.handle}`,
    });

    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

/** Delete one of this creator's own updates. Ownership checked before the write. */
export async function deleteUpdate(id: string): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    // deleteMany with the owner in the WHERE, so another creator's id simply
    // matches nothing rather than needing a separate read-then-check.
    const { count } = await prisma.update.deleteMany({
      where: { id, streamerId: creator.id },
    });
    if (count === 0) return { ok: false, error: "generic" };

    revalidatePath(DASHBOARD);
    revalidatePath(`/s/${creator.handle}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

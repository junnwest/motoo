"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MarketplaceItemType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentCreator } from "@/lib/session";
import { fulfillOrder, cancelOrder } from "@/lib/mochi";

/**
 * Server actions for the creator dashboard.
 *
 * Authorization rule: every action resolves the caller's own creator profile via
 * getCurrentCreator() and uses `creator.id` as the owning streamerId. A streamerId
 * is NEVER trusted from the client — a client may only reference rows it owns.
 */

type ActionResult = { ok: true } | { ok: false; error: string };

const DASHBOARD = "/creator/dashboard";

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

    await prisma.mochiIssuance.upsert({
      where: { streamerId: creator.id },
      create: {
        streamerId: creator.id,
        pricePerMochiKrw,
        goalQuantity,
        active,
      },
      update: { pricePerMochiKrw, goalQuantity, active },
    });

    revalidatePath(DASHBOARD);
    revalidatePath(`${DASHBOARD}/mochi`);
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
  stock: number | null;
  active: boolean;
}): Promise<ActionResult> {
  try {
    const creator = await getCurrentCreator();
    if (!creator) return { ok: false, error: "generic" };

    const parsed = itemSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: "generic" };
    const { id, title, description, priceMochi, itemType, stock, active } =
      parsed.data;

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
        data: { title, description, priceMochi, itemType, stock, active },
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
          stock,
          active,
          sortOrder: count,
        },
      });
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
    await fulfillOrder(orderId, creator.id);
    revalidatePath(`${DASHBOARD}/orders`);
    revalidatePath(DASHBOARD);
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
    await cancelOrder(orderId, creator.id);
    revalidatePath(`${DASHBOARD}/orders`);
    revalidatePath(DASHBOARD);
    return { ok: true };
  } catch {
    return { ok: false, error: "generic" };
  }
}

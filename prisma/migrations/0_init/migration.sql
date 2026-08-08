-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('backer', 'streamer', 'admin');

-- CreateEnum
CREATE TYPE "StreamerStatus" AS ENUM ('pending', 'approved', 'suspended');

-- CreateEnum
CREATE TYPE "UpdateVisibility" AS ENUM ('public', 'backers');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('female', 'male', 'other', 'undisclosed');

-- CreateEnum
CREATE TYPE "MarketplaceItemType" AS ENUM ('digital', 'access', 'physical', 'session');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'fulfilled', 'cancelled');

-- CreateEnum
CREATE TYPE "FulfillmentMode" AS ENUM ('instant', 'request');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('order_fulfilled', 'order_cancelled', 'new_item', 'price_raised', 'new_update');

-- CreateTable
CREATE TABLE "Streamer" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "category" TEXT NOT NULL,
    "creatorType" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "ownerId" TEXT,
    "chzzk" TEXT,
    "soop" TEXT,
    "youtube" TEXT,
    "twitch" TEXT,
    "discordUrl" TEXT,
    "fanCafeUrl" TEXT,
    "status" "StreamerStatus" NOT NULL DEFAULT 'pending',
    "subMerchantId" TEXT,
    "avgViewers" INTEGER NOT NULL DEFAULT 0,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Streamer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Backer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "handle" TEXT,
    "avatarUrl" TEXT,
    "currencyBalance" INTEGER NOT NULL DEFAULT 0,
    "role" "Role" NOT NULL DEFAULT 'backer',
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "pendingDeletionAt" TIMESTAMP(3),
    "onboardedAt" TIMESTAMP(3),
    "termsAgreedAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "creatorIntent" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedName" TEXT,
    "birthYear" INTEGER,
    "gender" "Gender",
    "ageVerified" BOOLEAN NOT NULL DEFAULT false,
    "guardianConsent" BOOLEAN,

    CONSTRAINT "Backer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Update" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "visibility" "UpdateVisibility" NOT NULL DEFAULT 'public',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "reactionCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Update_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MochiIssuance" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "pricePerMochiKrw" INTEGER NOT NULL,
    "goalQuantity" INTEGER NOT NULL,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "lifetimeSold" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MochiIssuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MochiHolding" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "purchasedTotal" INTEGER NOT NULL DEFAULT 0,
    "krwPaidTotal" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MochiHolding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketplaceItem" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priceMochi" INTEGER NOT NULL,
    "itemType" "MarketplaceItemType" NOT NULL,
    "thumbnailKey" TEXT,
    "coverImage" TEXT,
    "fulfillment" "FulfillmentMode" NOT NULL DEFAULT 'request',
    "stock" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketplaceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "mochiSpent" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fulfilledAt" TIMESTAMP(3),

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Streamer_handle_key" ON "Streamer"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "Streamer_ownerId_key" ON "Streamer"("ownerId");

-- CreateIndex
CREATE INDEX "Streamer_status_idx" ON "Streamer"("status");

-- CreateIndex
CREATE INDEX "Streamer_category_idx" ON "Streamer"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Backer_email_key" ON "Backer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Backer_handle_key" ON "Backer"("handle");

-- CreateIndex
CREATE INDEX "Update_streamerId_idx" ON "Update"("streamerId");

-- CreateIndex
CREATE UNIQUE INDEX "MochiIssuance_streamerId_key" ON "MochiIssuance"("streamerId");

-- CreateIndex
CREATE INDEX "MochiHolding_streamerId_idx" ON "MochiHolding"("streamerId");

-- CreateIndex
CREATE INDEX "MochiHolding_backerId_idx" ON "MochiHolding"("backerId");

-- CreateIndex
CREATE UNIQUE INDEX "MochiHolding_streamerId_backerId_key" ON "MochiHolding"("streamerId", "backerId");

-- CreateIndex
CREATE INDEX "MarketplaceItem_streamerId_idx" ON "MarketplaceItem"("streamerId");

-- CreateIndex
CREATE INDEX "MarketplaceItem_streamerId_active_idx" ON "MarketplaceItem"("streamerId", "active");

-- CreateIndex
CREATE INDEX "Order_streamerId_idx" ON "Order"("streamerId");

-- CreateIndex
CREATE INDEX "Order_backerId_idx" ON "Order"("backerId");

-- CreateIndex
CREATE INDEX "Order_itemId_idx" ON "Order"("itemId");

-- CreateIndex
CREATE INDEX "Order_streamerId_status_idx" ON "Order"("streamerId", "status");

-- CreateIndex
CREATE INDEX "Order_backerId_status_idx" ON "Order"("backerId", "status");

-- CreateIndex
CREATE INDEX "Follow_streamerId_idx" ON "Follow"("streamerId");

-- CreateIndex
CREATE INDEX "Follow_backerId_idx" ON "Follow"("backerId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_streamerId_backerId_key" ON "Follow"("streamerId", "backerId");

-- CreateIndex
CREATE INDEX "Notification_backerId_read_idx" ON "Notification"("backerId", "read");

-- CreateIndex
CREATE INDEX "Notification_backerId_createdAt_idx" ON "Notification"("backerId", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimit_windowStart_idx" ON "RateLimit"("windowStart");

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_key_windowStart_key" ON "RateLimit"("key", "windowStart");

-- AddForeignKey
ALTER TABLE "Streamer" ADD CONSTRAINT "Streamer_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Backer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Update" ADD CONSTRAINT "Update_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MochiIssuance" ADD CONSTRAINT "MochiIssuance_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MochiHolding" ADD CONSTRAINT "MochiHolding_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MochiHolding" ADD CONSTRAINT "MochiHolding_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketplaceItem" ADD CONSTRAINT "MarketplaceItem_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "MarketplaceItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;


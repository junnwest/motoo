-- CreateEnum
CREATE TYPE "OrderIssueReason" AS ENUM ('not_delivered', 'not_as_described', 'other');

-- CreateEnum
CREATE TYPE "OrderIssueStatus" AS ENUM ('open', 'replied', 'resolved', 'escalated');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'order_issue';

-- CreateTable
CREATE TABLE "OrderIssue" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" "OrderIssueReason" NOT NULL,
    "detail" TEXT NOT NULL,
    "status" "OrderIssueStatus" NOT NULL DEFAULT 'open',
    "creatorReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderIssue_orderId_key" ON "OrderIssue"("orderId");

-- CreateIndex
CREATE INDEX "OrderIssue_status_createdAt_idx" ON "OrderIssue"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderIssue" ADD CONSTRAINT "OrderIssue_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

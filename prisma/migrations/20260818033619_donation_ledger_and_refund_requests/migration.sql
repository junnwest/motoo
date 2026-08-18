-- CreateEnum
CREATE TYPE "RefundReason" AS ENUM ('withdrawal', 'legal', 'other');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('open', 'approved', 'rejected', 'refunded');

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "amountKrw" INTEGER NOT NULL,
    "mochiGranted" INTEGER NOT NULL,
    "pricePerMochiKrw" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refundedAt" TIMESTAMP(3),

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "reason" "RefundReason" NOT NULL,
    "detail" TEXT,
    "eligibleAtRequest" BOOLEAN NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolution" TEXT,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Donation_idempotencyKey_key" ON "Donation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Donation_backerId_createdAt_idx" ON "Donation"("backerId", "createdAt");

-- CreateIndex
CREATE INDEX "Donation_streamerId_createdAt_idx" ON "Donation"("streamerId", "createdAt");

-- CreateIndex
CREATE INDEX "RefundRequest_status_createdAt_idx" ON "RefundRequest"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefundRequest_donationId_key" ON "RefundRequest"("donationId");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

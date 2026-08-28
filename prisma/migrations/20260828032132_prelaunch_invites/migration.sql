-- AlterTable
ALTER TABLE "Backer" ADD COLUMN     "foundingAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "email" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedByBackerId" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "Invite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_redeemedByBackerId_key" ON "Invite"("redeemedByBackerId");

-- CreateIndex
CREATE INDEX "Invite_createdAt_idx" ON "Invite"("createdAt");

-- CreateIndex
CREATE INDEX "Invite_redeemedAt_idx" ON "Invite"("redeemedAt");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_redeemedByBackerId_fkey" FOREIGN KEY ("redeemedByBackerId") REFERENCES "Backer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

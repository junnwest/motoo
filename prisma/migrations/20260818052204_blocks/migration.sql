-- CreateEnum
CREATE TYPE "BlockInitiator" AS ENUM ('fan', 'creator');

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "backerId" TEXT NOT NULL,
    "streamerId" TEXT NOT NULL,
    "initiator" "BlockInitiator" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Block_backerId_initiator_idx" ON "Block"("backerId", "initiator");

-- CreateIndex
CREATE INDEX "Block_streamerId_initiator_idx" ON "Block"("streamerId", "initiator");

-- CreateIndex
CREATE UNIQUE INDEX "Block_backerId_streamerId_initiator_key" ON "Block"("backerId", "streamerId", "initiator");

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_backerId_fkey" FOREIGN KEY ("backerId") REFERENCES "Backer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_streamerId_fkey" FOREIGN KEY ("streamerId") REFERENCES "Streamer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

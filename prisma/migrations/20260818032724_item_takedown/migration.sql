-- AlterTable
ALTER TABLE "MarketplaceItem" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenBy" TEXT,
ADD COLUMN     "hiddenReason" TEXT;

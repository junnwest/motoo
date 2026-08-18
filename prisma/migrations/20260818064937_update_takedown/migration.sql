-- AlterEnum
ALTER TYPE "ReportTargetType" ADD VALUE 'update';

-- AlterTable
ALTER TABLE "Update" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenBy" TEXT,
ADD COLUMN     "hiddenReason" TEXT;

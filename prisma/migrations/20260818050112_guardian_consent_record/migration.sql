-- CreateEnum
CREATE TYPE "GuardianRelation" AS ENUM ('parent', 'grandparent', 'sibling', 'other');

-- AlterTable
ALTER TABLE "Backer" ADD COLUMN     "guardianConsentAt" TIMESTAMP(3),
ADD COLUMN     "guardianContact" TEXT,
ADD COLUMN     "guardianName" TEXT,
ADD COLUMN     "guardianRelation" "GuardianRelation";

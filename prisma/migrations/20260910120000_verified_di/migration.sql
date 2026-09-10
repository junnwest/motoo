-- AlterTable
ALTER TABLE "Backer" ADD COLUMN     "verifiedDi" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Backer_verifiedDi_key" ON "Backer"("verifiedDi");

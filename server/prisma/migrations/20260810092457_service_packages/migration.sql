-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREATE_SERVICE_PACKAGE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_SERVICE_PACKAGE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_SERVICE_PACKAGE';

-- AlterTable
ALTER TABLE "Setting" ALTER COLUMN "broadcastSlideSeconds" SET DEFAULT 24,
ALTER COLUMN "broadcastLanguageSeconds" SET DEFAULT 12;

-- CreateTable
CREATE TABLE "ServicePackage" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "titleRu" VARCHAR(160) NOT NULL,
    "titleKz" VARCHAR(160) NOT NULL,
    "targetAudienceRu" VARCHAR(800) NOT NULL,
    "targetAudienceKz" VARCHAR(800) NOT NULL,
    "descriptionRu" TEXT NOT NULL,
    "descriptionKz" TEXT NOT NULL,
    "serviceZoneRu" VARCHAR(500) NOT NULL,
    "serviceZoneKz" VARCHAR(500) NOT NULL,
    "noteRu" VARCHAR(1000),
    "noteKz" VARCHAR(1000),
    "icon" VARCHAR(60) NOT NULL DEFAULT 'Package',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicePackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServiceToServicePackage" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceToServicePackage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServicePackage_slug_key" ON "ServicePackage"("slug");

-- CreateIndex
CREATE INDEX "ServicePackage_slug_idx" ON "ServicePackage"("slug");

-- CreateIndex
CREATE INDEX "ServicePackage_isPublished_idx" ON "ServicePackage"("isPublished");

-- CreateIndex
CREATE INDEX "ServicePackage_sortOrder_idx" ON "ServicePackage"("sortOrder");

-- CreateIndex
CREATE INDEX "_ServiceToServicePackage_B_index" ON "_ServiceToServicePackage"("B");

-- AddForeignKey
ALTER TABLE "_ServiceToServicePackage" ADD CONSTRAINT "_ServiceToServicePackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceToServicePackage" ADD CONSTRAINT "_ServiceToServicePackage_B_fkey" FOREIGN KEY ("B") REFERENCES "ServicePackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

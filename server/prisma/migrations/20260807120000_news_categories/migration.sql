-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('GENERAL', 'IMPORTANT', 'ANNOUNCEMENT', 'EVENT');

-- AlterTable
ALTER TABLE "News" ADD COLUMN "category" "NewsCategory" NOT NULL DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "News_category_idx" ON "News"("category");

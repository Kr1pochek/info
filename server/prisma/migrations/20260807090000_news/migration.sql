-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_NEWS';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_NEWS';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_NEWS';
ALTER TYPE "AuditAction" ADD VALUE 'PUBLISH_NEWS';
ALTER TYPE "AuditAction" ADD VALUE 'UNPUBLISH_NEWS';

-- CreateTable
CREATE TABLE "News" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(240) NOT NULL,
    "description" VARCHAR(800) NOT NULL,
    "content" TEXT NOT NULL,
    "image" VARCHAR(500) NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "News_slug_key" ON "News"("slug");
CREATE INDEX "News_published_publishedAt_idx" ON "News"("published", "publishedAt");
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");
CREATE INDEX "News_authorId_idx" ON "News"("authorId");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

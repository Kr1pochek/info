CREATE TYPE "BroadcastItemType" AS ENUM ('BIRTHDAY', 'VIDEO');

ALTER TYPE "AuditAction" ADD VALUE 'CREATE_BROADCAST_ITEM';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_BROADCAST_ITEM';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_BROADCAST_ITEM';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_BROADCAST_SETTINGS';

ALTER TABLE "Setting"
ADD COLUMN "tickerTextRu" VARCHAR(1000) NOT NULL DEFAULT 'Важная информация и актуальные объявления доступны на корпоративном портале',
ADD COLUMN "tickerTextKz" VARCHAR(1000) NOT NULL DEFAULT 'Маңызды ақпарат пен өзекті хабарландырулар корпоративтік порталда қолжетімді',
ADD COLUMN "broadcastSlideSeconds" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN "broadcastLanguageSeconds" INTEGER NOT NULL DEFAULT 10;

CREATE TABLE "BroadcastItem" (
  "id" SERIAL NOT NULL,
  "type" "BroadcastItemType" NOT NULL,
  "titleRu" VARCHAR(240) NOT NULL,
  "titleKz" VARCHAR(240) NOT NULL,
  "descriptionRu" VARCHAR(1200) NOT NULL,
  "descriptionKz" VARCHAR(1200) NOT NULL,
  "mediaUrl" VARCHAR(500),
  "eventDate" DATE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "authorId" INTEGER,
  CONSTRAINT "BroadcastItem_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "BroadcastItem" ADD CONSTRAINT "BroadcastItem_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "BroadcastItem_type_isActive_idx" ON "BroadcastItem"("type", "isActive");
CREATE INDEX "BroadcastItem_sortOrder_idx" ON "BroadcastItem"("sortOrder");
CREATE INDEX "BroadcastItem_authorId_idx" ON "BroadcastItem"("authorId");

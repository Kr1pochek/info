CREATE TYPE "BroadcastMediaKind" AS ENUM ('IMAGE', 'VIDEO');

ALTER TABLE "News"
ADD COLUMN "expiresAt" TIMESTAMP(3),
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "BroadcastItem"
ADD COLUMN "mediaKind" "BroadcastMediaKind";

UPDATE "BroadcastItem"
SET "mediaKind" = CASE
  WHEN LOWER("mediaUrl") ~ '\.(jpg|jpeg|png|webp|gif)$' THEN 'IMAGE'::"BroadcastMediaKind"
  ELSE 'VIDEO'::"BroadcastMediaKind"
END
WHERE "type" = 'VIDEO' AND "mediaUrl" IS NOT NULL;

CREATE INDEX "News_expiresAt_idx" ON "News"("expiresAt");
CREATE INDEX "News_sortOrder_idx" ON "News"("sortOrder");

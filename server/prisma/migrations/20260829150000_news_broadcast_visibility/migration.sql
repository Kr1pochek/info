ALTER TABLE "News"
ADD COLUMN "showInBroadcast" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "News_showInBroadcast_published_publishedAt_idx"
ON "News"("showInBroadcast", "published", "publishedAt");

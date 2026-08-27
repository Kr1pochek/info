ALTER TABLE "News"
ADD COLUMN "isPriority" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "News_isPriority_published_publishedAt_expiresAt_idx"
ON "News"("isPriority", "published", "publishedAt", "expiresAt");

ALTER TABLE "Setting" ADD COLUMN "broadcastIdleSeconds" INTEGER NOT NULL DEFAULT 60;

UPDATE "Setting"
SET "broadcastSlideSeconds" = 24,
    "broadcastLanguageSeconds" = 12
WHERE "broadcastSlideSeconds" = 15
  AND "broadcastLanguageSeconds" = 10;

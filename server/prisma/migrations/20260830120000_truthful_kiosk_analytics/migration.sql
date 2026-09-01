-- Existing rows were collected before event provenance and idempotent delivery
-- were introduced. Keep them for audit purposes, but mark them as legacy so
-- they do not distort the verified kiosk analytics.
ALTER TABLE "AnalyticsEvent"
ADD COLUMN "eventId" VARCHAR(80),
ADD COLUMN "source" VARCHAR(20) NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "occurredAt" TIMESTAMP(3);

UPDATE "AnalyticsEvent"
SET
  "eventId" = 'legacy-' || "id"::text,
  "occurredAt" = "createdAt";

ALTER TABLE "AnalyticsEvent"
ALTER COLUMN "eventId" SET NOT NULL,
ALTER COLUMN "occurredAt" SET NOT NULL,
ALTER COLUMN "occurredAt" SET DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "AnalyticsEvent_eventId_key" ON "AnalyticsEvent"("eventId");
CREATE INDEX "AnalyticsEvent_source_occurredAt_idx" ON "AnalyticsEvent"("source", "occurredAt");
CREATE INDEX "AnalyticsEvent_sessionId_occurredAt_idx" ON "AnalyticsEvent"("sessionId", "occurredAt");

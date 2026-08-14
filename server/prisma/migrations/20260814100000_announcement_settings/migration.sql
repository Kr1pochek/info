ALTER TABLE "Setting"
  ADD COLUMN "announcementLanguage" VARCHAR(2) NOT NULL DEFAULT 'ru',
  ADD COLUMN "announcementVolume" INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN "announcementRepeatSeconds" INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN "accessibleAudioEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "accessibleAudioVolume" INTEGER NOT NULL DEFAULT 100;

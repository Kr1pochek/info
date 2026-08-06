ALTER TABLE "Setting" ALTER COLUMN "defaultLanguage" SET DEFAULT 'kz';

UPDATE "Setting" SET "defaultLanguage" = 'kz';

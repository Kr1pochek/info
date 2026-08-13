ALTER TABLE "Setting"
  ADD COLUMN "taxpayerRightsRu" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "taxpayerRightsKz" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "ethicsOfficerNameRu" VARCHAR(240) NOT NULL DEFAULT '',
  ADD COLUMN "ethicsOfficerNameKz" VARCHAR(240) NOT NULL DEFAULT '',
  ADD COLUMN "ethicsOfficerContactsRu" VARCHAR(1000) NOT NULL DEFAULT '',
  ADD COLUMN "ethicsOfficerContactsKz" VARCHAR(1000) NOT NULL DEFAULT '',
  ADD COLUMN "ethicsOfficerPhoto" VARCHAR(500) NOT NULL DEFAULT '',
  ADD COLUMN "reportingDeadlines" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "panelQrCodes" JSONB NOT NULL DEFAULT '[{"id":"kgd-official","labelRu":"Портал государственных доходов","labelKz":"Мемлекеттік кірістер порталы","image":"/qr/kgd-portal.png","url":"https://kgd.gov.kz/","isActive":true},{"id":"egov-official","labelRu":"Электронное правительство","labelKz":"Электрондық үкімет","image":"/qr/egov-portal.png","url":"https://egov.kz/","isActive":true}]',
  ADD COLUMN "onlineSpecialists" JSONB NOT NULL DEFAULT '[]';

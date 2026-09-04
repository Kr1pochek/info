ALTER TABLE "Setting"
ADD COLUMN "customsQrCodes" JSONB NOT NULL DEFAULT '[]';

UPDATE "Setting"
SET "customsQrCodes" = $$[
  {
    "id": "almaty-cto",
    "code": "39855302",
    "image": "/qr/customs/almaty-cto-2gis.png",
    "titleKz": "«Алматы-ЦТО» кеден бекеті",
    "titleRu": "Т/П «Алматы-ЦТО»",
    "addressKz": "Сүйінбай даңғылы, 2 к7, «Мерей» СК, 1-қабат",
    "addressRu": "проспект Суюнбая, 2 к7, ТК «Мерей», 1 этаж",
    "targetUrl": "https://2gis.kz/almaty/firm/9429940001288203",
    "targetTypeKz": "2GIS мекенжайы",
    "targetTypeRu": "Адрес в 2GIS",
    "isActive": true
  },
  {
    "id": "almaly-cto",
    "code": "39855307",
    "image": "/qr/customs/almaly-cto-2gis.png",
    "titleKz": "«Алмалы-ЦТО» кеден бекеті",
    "titleRu": "Т/П «Алмалы-ЦТО»",
    "addressKz": "Свободная көшесінен шығысқа қарай, Бекмаханов көшесінен солтүстікке қарай",
    "addressRu": "восточнее ул. Свободная, севернее ул. Бекмаханова",
    "targetUrl": "https://2gis.kz/almaty/search/%D0%A2%2F%D0%9F%20%D0%90%D0%BB%D0%BC%D0%B0%D0%BB%D1%8B-%D0%A6%D0%A2%D0%9E%20%D0%B2%D0%BE%D1%81%D1%82%D0%BE%D1%87%D0%BD%D0%B5%D0%B5%20%D1%83%D0%BB.%20%D0%A1%D0%B2%D0%BE%D0%B1%D0%BE%D0%B4%D0%BD%D0%B0%D1%8F%20%D1%81%D0%B5%D0%B2%D0%B5%D1%80%D0%BD%D0%B5%D0%B5%20%D1%83%D0%BB.%20%D0%91%D0%B5%D0%BA%D0%BC%D0%B0%D1%85%D0%B0%D0%BD%D0%BE%D0%B2%D0%B0%20%D0%90%D0%BB%D0%BC%D0%B0%D1%82%D1%8B",
    "targetTypeKz": "2GIS іздеу",
    "targetTypeRu": "Поиск в 2GIS",
    "isActive": true
  },
  {
    "id": "zhetysu-customs",
    "code": "39855301",
    "image": "/qr/customs/zhetysu-2gis.png",
    "titleKz": "«Жетісу» кеден бекеті",
    "titleRu": "Т/П «Жетысу»",
    "addressKz": "Ахметов / Закарпатская көшесі, 51Б, 2-қабат",
    "addressRu": "улица Ахметова / Закарпатская, 51Б, 2 этаж",
    "targetUrl": "https://2gis.kz/almaty/firm/70000001023602643",
    "targetTypeKz": "2GIS мекенжайы",
    "targetTypeRu": "Адрес в 2GIS",
    "isActive": true
  }
]$$::jsonb
WHERE id = 1 AND jsonb_array_length("customsQrCodes") = 0;

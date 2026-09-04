UPDATE "Setting"
SET "customsQrCodes" = (
  SELECT jsonb_agg(
    CASE
      WHEN item->>'id' = 'almaly-cto' THEN
        jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  jsonb_set(
                    item,
                    '{image}',
                    to_jsonb('/qr/customs/almaty-cto-2gis.png'::text),
                    true
                  ),
                  '{addressKz}',
                  to_jsonb('Сүйінбай даңғылы, 2 к7, «Мерей» СК, 1-қабат'::text),
                  true
                ),
                '{addressRu}',
                to_jsonb('проспект Суюнбая, 2 к7, ТК «Мерей», 1 этаж'::text),
                true
              ),
              '{targetUrl}',
              to_jsonb('https://2gis.kz/almaty/firm/9429940001288203'::text),
              true
            ),
            '{targetTypeKz}',
            to_jsonb('2GIS мекенжайы'::text),
            true
          ),
          '{targetTypeRu}',
          to_jsonb('Адрес в 2GIS'::text),
          true
        )
      ELSE item
    END
    ORDER BY ord
  )
  FROM jsonb_array_elements("customsQrCodes") WITH ORDINALITY AS entry(item, ord)
)
WHERE jsonb_typeof("customsQrCodes") = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements("customsQrCodes") AS item
    WHERE item->>'id' = 'almaly-cto'
  );

UPDATE "Setting"
SET
  "workingHoursRu" = 'Пн–Пт, 08:30–17:30',
  "workingHoursKz" = 'Дс–Жм, 08:30–17:30',
  "panelQrCodes" = (
    SELECT COALESCE(
      jsonb_agg(
        CASE
          WHEN item->>'id' = 'kgd-official'
            THEN jsonb_set(item, '{url}', to_jsonb('https://portal.kgd.gov.kz/'::text))
          ELSE item
        END
        ORDER BY position
      ),
      '[]'::jsonb
    )
    FROM jsonb_array_elements("Setting"."panelQrCodes") WITH ORDINALITY AS qr(item, position)
  )
WHERE "id" = 1;

UPDATE "Service"
SET
  "workingHoursRu" = 'Понедельник–пятница, 08:30–17:30',
  "workingHoursKz" = 'Дүйсенбі–жұма, 08:30–17:30';

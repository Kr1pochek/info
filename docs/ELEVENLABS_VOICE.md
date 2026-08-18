# ElevenLabs: единый голос KZ / RU / EN

Генератор использует один и тот же `voice_id` и модель `eleven_v3` для казахского, русского и английского. Готовые файлы приводятся к формату MP3, 24 кГц, mono, 128 кбит/с и громкости −18 LUFS.

## Ключ API

Добавьте ключ в игнорируемый корневой файл `.env`:

```dotenv
ELEVENLABS_API_KEY=ваш_ключ
```

Ключ не записывается в манифесты, аудиофайлы или Git.

## Вариант 1: создать уникальный голос

Сгенерировать три кандидата через ElevenLabs Voice Design:

```powershell
npm run tts:elevenlabs:design
```

Откройте `artifacts/elevenlabs-voice-design/index.html`, прослушайте варианты и сохраните выбранный, например первый:

```powershell
npm run tts:elevenlabs -- --select=1
```

Команда создаёт голос в рабочем пространстве ElevenLabs и сразу озвучивает три языковых образца. Повторный запуск использует уже сохранённый `voice_id` и не создаёт дубликат.

## Вариант 2: использовать готовый голос

По умолчанию используется системный женский голос Sarah (`EXAVITQu4vr4xnSDxMaL`), доступный на бесплатном API-тарифе. Можно указать любой доступный голос из вашей библиотеки:

```powershell
npm run tts:elevenlabs -- --voice-id=ВАШ_VOICE_ID
```

Либо сохранить идентификатор в `.env`:

```dotenv
ELEVENLABS_VOICE_ID=ваш_voice_id
```

Результат и страница сравнения появятся в `client/public/audio/seo/elevenlabs-voices/`. Для принудительной перегенерации добавьте `--force`.

Проверить план без ключа и расходования кредитов:

```powershell
npm run tts:elevenlabs -- --dry-run
```

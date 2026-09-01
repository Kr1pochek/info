# Подготовка к production

Проект не привязан к конкретной операционной системе. В production backend раздаёт собранный frontend и API на одном порту. Vite отдельно не запускается.

## Обязательная конфигурация

Перед развёртыванием создайте конфигурацию из `server/.env.production.example` для обычного запуска или из `deploy/.env.example` для Docker Compose.

- используйте отдельного пользователя PostgreSQL без прав суперпользователя;
- задайте разные случайные JWT-секреты длиной не менее 32 символов;
- задайте уникальный пароль первого администратора и смените его после входа;
- не храните рабочие `.env` в Git;
- при HTTPS укажите публичный адрес приложения в `CLIENT_URL`;
- если приложение находится ровно за одним reverse proxy, задайте `TRUST_PROXY_HOPS=1`; при прямом доступе оставьте `0`.

Если пароль PostgreSQL содержит специальные символы, в `DATABASE_URL` они должны быть URL-кодированы. Значение `POSTGRES_PASSWORD` при этом остаётся обычным паролем.

## Проверка релиза

```bash
npm ci
npm ci --prefix client
npm ci --prefix server
npm run release:check
npm run security:check
```

`release:check` проверяет lint, production-сборку, API, интерфейс, kiosk-разрешения, конфигурацию, подключение к PostgreSQL и состояние миграций.

## Универсальный запуск через Docker Compose

```bash
cp deploy/.env.example deploy/.env
# заполнить deploy/.env реальными значениями
docker compose --env-file deploy/.env -f compose.production.yml up -d --build
docker compose --env-file deploy/.env -f compose.production.yml ps
```

Сервис `migrate` применяет миграции до запуска приложения. Первичное заполнение справочников выполняется осознанно один раз:

```bash
docker compose --env-file deploy/.env -f compose.production.yml run --rm app npm run db:seed --prefix server
```

По умолчанию приложение слушает только `127.0.0.1:4000`. Для доступа из локальной сети без reverse proxy задайте `APP_BIND_ADDRESS=0.0.0.0`. Для публичного размещения оставьте loopback и публикуйте приложение через HTTPS reverse proxy.

Проверки состояния:

- `/api/health/live` — процесс работает;
- `/api/health/ready` — приложение видит PostgreSQL и готово принимать трафик.

## Обновление

Перед обновлением сделайте резервную копию PostgreSQL и каталога загрузок. Затем получите новую версию и повторно выполните `docker compose --env-file deploy/.env -f compose.production.yml up -d --build`. Миграции применятся до переключения приложения на новую версию.

## Данные и резервные копии

Необходимо сохранять две независимые части:

1. дамп PostgreSQL;
2. содержимое `/app/server/uploads` или тома `uploads_data`.

Храните копии отдельно от сервера и регулярно проверяйте восстановление на тестовой базе. Наличие архива без успешной пробной реставрации не считается проверенным backup.

## Что зависит от выбранной площадки

После выбора сервера останется настроить только внешний контур: HTTPS-сертификат, reverse proxy, DNS или локальный адрес, автозапуск Docker/Node, расписание backup и мониторинг health-check. Код приложения и схема запуска от этого не меняются.

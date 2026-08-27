# Развёртывание на Windows без Docker

Инструкция рассчитана на серверный компьютер, где PostgreSQL установлен как обычная служба Windows.

## 1. Требования

- Node.js 20 или новее;
- PostgreSQL 14 или новее, запущенный как служба;
- Google Chrome или Microsoft Edge;
- Git.

Проверка:

```powershell
node --version
git --version
Get-Service *postgres*
```

## 2. Подготовка базы

Создайте базу `dgd_infokiosk`, затем скопируйте `server/.env.production.example` в `server/.env`. Укажите реальный адрес, порт, отдельного пользователя приложения и пароль PostgreSQL, новый пароль seed-администратора и две разные случайные JWT-строки длиной не менее 32 символов.

Нельзя оставлять тестовые пароли и JWT-секреты из примера.

## 3. Установка и обновление

Первый запуск из корня репозитория:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1
```

Если скрипт впервые создал `server/.env`, заполните его и повторите команду. Скрипт устанавливает зависимости, применяет миграции, заполняет справочники и собирает frontend.

Обновление:

```powershell
git pull origin main
powershell -ExecutionPolicy Bypass -File .\scripts\windows\install.ps1 -SkipSeed
```

Без `-SkipSeed` seed безопасно обновляет 41 услугу для стенда 2026 года и 5 опубликованных пакетов, не создавая дубликаты. Пакет «Почётный» остаётся неопубликованным черновиком.

Для осознанной ротации пароля существующего seed-администратора временно задайте `SEED_ADMIN_RESET_PASSWORD=true`, запустите `npm run db:seed`, затем сразу верните значение `false`. Обычный seed рабочий пароль не сбрасывает.

## 4. Запуск

Запуск новостного экрана:

```powershell
.\scripts\windows\start-kiosk.ps1 -Page news
```

Запуск каталога услуг:

```powershell
.\scripts\windows\start-kiosk.ps1 -Page kiosk
```

Production-сервер слушает порт 4000 и сам отдаёт собранный интерфейс. Отдельный Vite-процесс на порту 5174 на сервере не нужен.

## 5. Автозапуск

Автоматическая регистрация задач Windows не входит в поставку: корпоративные антивирусы часто блокируют PowerShell-сценарии, которые создают скрытые задачи планировщика. Для обычной работы запускайте киоск командой из раздела 4.

Если автозапуск обязателен, попросите системного администратора создать задачу через штатный интерфейс «Планировщика заданий» согласно политикам организации. Задача должна запускать `scripts\windows\start-kiosk.ps1` после входа выделенного пользователя.

Оставшиеся от предыдущей установки задачи можно удалить безопасным сценарием:

```powershell
.\scripts\windows\unregister-autostart.ps1
.\scripts\windows\unregister-maintenance.ps1
```

Проверку состояния и резервное копирование можно запускать вручную:

```powershell
.\scripts\windows\health-check.ps1
.\scripts\windows\backup.ps1 -BackupRoot D:\DGD-Backups -RetentionDays 14
```

## 6. Проверка и диагностика

```powershell
.\scripts\windows\health-check.ps1
```

Также откройте `http://127.0.0.1:4000/api/health`. Ответ должен содержать `database: connected`. Ошибки процесса записываются в `logs/server.error.log`.

Полная проверка окружения, production-секретов, сборки, подключения к базе и миграций:

```powershell
npm run doctor -- --production
```

Для внешнего мониторинга доступны две отдельные проверки:

- `/api/health/live` — процесс приложения работает;
- `/api/health/ready` — приложение готово принимать трафик и видит PostgreSQL.

Если появляется `Can't reach database server`, проверьте службу PostgreSQL, порт из `DATABASE_URL`, firewall и прослушивание порта:

```powershell
Get-Service *postgres*
Test-NetConnection 127.0.0.1 -Port 5433
```

## 7. Резервная копия

Команда сохраняет дамп PostgreSQL и архив загруженных изображений/видео, удаляя собственные архивы старше 14 дней:

```powershell
.\scripts\windows\backup.ps1 -BackupRoot D:\DGD-Backups -RetentionDays 14
```

`pg_dump.exe` должен быть доступен через PATH. Папку резервных копий рекомендуется хранить на другом диске и копировать во внешнее защищённое хранилище.

## 8. Восстановление и проверка копии

Перед восстановлением остановите kiosk/backend или убедитесь, что в системе нет активного редактирования. Скрипт по умолчанию сначала создаёт страховочную копию текущей базы, а затем запрашивает подтверждение destructive-операции:

```powershell
.\scripts\windows\restore.ps1 `
  -DatabaseBackup D:\DGD-Backups\database-20260818-020000.dump `
  -UploadsBackup D:\DGD-Backups\uploads-20260818-020000.zip
```

После восстановления обязательно выполните:

```powershell
.\scripts\windows\health-check.ps1
npm run verify
```

Не реже одного раза в месяц восстанавливайте последнюю копию в отдельную тестовую базу. Наличие `.dump` без успешного пробного восстановления не считается подтверждённым backup.

## 9. Логи

Долгоживущий backend пишет stdout и stderr в `logs/server.out.log` и `logs/server.error.log`. Перед запуском файлы больше 20 МБ автоматически ротируются, хранится до пяти предыдущих копий. Значения можно изменить параметрами `run-server.ps1`.

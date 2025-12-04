# База данных

Эта папка содержит все файлы, связанные с работой с базой данных проекта.

## Структура

- `database_dumps/` - папка для хранения SQL дампов базы данных
- `create_db_dump.bat` - скрипт для создания дампа базы данных
- `restore_db_dump.bat` - скрипт для восстановления базы из дампа
- `migrations/` - папка для хранения SQL скриптов миграций (если нужны)

### Создание дампа

```bash
database\create_db_dump.bat
```

### Восстановление дампа

```bash
database\restore_db_dump.bat
```

## Миграции Django

Миграции Django находятся в соответствующих приложениях:
- `backend/accounts/migrations/`
- `backend/shop/migrations/`
- `backend/events/migrations/`
- и т.д.

Для применения миграций:

```bash
cd backend
python manage.py migrate
```

## Настройки подключения

Настройки базы данных находятся в `backend/tuning_studio/settings.py` и читаются из переменных окружения.

Создайте файл `.env` в папке `backend/`:

```env
DB_NAME=tuning_studio_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```


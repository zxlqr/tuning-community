# Дампы базы данных

Эта папка предназначена для хранения дампов базы данных проекта.

## Создание дампа

Используйте скрипт `create_db_dump.bat` из папки `database/`:

```bash
database\create_db_dump.bat
```

Скрипт создаст SQL дамп базы данных в этой папке.

## Восстановление дампа

Используйте скрипт `restore_db_dump.bat`:

```bash
database\restore_db_dump.bat
```

## Восстановление на новом сервере

1. Создайте базу данных PostgreSQL
2. Восстановите дамп с помощью `restore_db_dump.bat`
3. Примените миграции Django: `python manage.py migrate`


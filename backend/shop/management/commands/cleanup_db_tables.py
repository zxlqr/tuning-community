from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
from django.apps import apps


class Command(BaseCommand):
    help = 'Удаляет все лишние таблицы, оставляя только те, что нужны для работы проекта'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Подтвердить удаление (без этого флага только показывается, что будет удалено)',
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write("ОЧИСТКА БАЗЫ ДАННЫХ ОТ ЛИШНИХ ТАБЛИЦ")
        self.stdout.write("=" * 70)
        
        # Получаем ожидаемые таблицы из установленных приложений
        expected_tables = set()
        
        # Таблицы из моделей установленных приложений
        for app_config in apps.get_app_configs():
            app_name = app_config.name
            # Проверяем, что приложение в INSTALLED_APPS
            if app_name in settings.INSTALLED_APPS:
                for model in app_config.get_models():
                    expected_tables.add(model._meta.db_table)
        
        # Системные таблицы Django (всегда нужны)
        django_system_tables = {
            'django_migrations',
            'django_content_type',
            'django_session',
            'auth_permission',
            'auth_group',
            'auth_group_permissions',
            'auth_user_groups',  # Стандартная таблица Django для групп пользователей
            'auth_user_user_permissions',  # Стандартная таблица Django для прав пользователей
        }
        expected_tables.update(django_system_tables)
        
        # Получаем фактические таблицы из БД
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """)
            actual_tables = {row[0] for row in cursor.fetchall()}
        
        self.stdout.write(f"\nСтатистика:")
        self.stdout.write(f"  - Ожидаемых таблиц (нужных): {len(expected_tables)}")
        self.stdout.write(f"  - Фактических таблиц в БД: {len(actual_tables)}")
        
        # Лишние таблицы
        extra_tables = actual_tables - expected_tables
        
        if not extra_tables:
            self.stdout.write(self.style.SUCCESS("\nЛишних таблиц не обнаружено. БД чистая!"))
            return
        
        self.stdout.write(f"\nНайдено лишних таблиц: {len(extra_tables)}")
        self.stdout.write("\nСписок лишних таблиц:")
        for table in sorted(extra_tables):
            # Проверяем, есть ли данные
            with connection.cursor() as cursor:
                try:
                    cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
                    count = cursor.fetchone()[0]
                    status = f"({count} записей)" if count > 0 else "(пустая)"
                except:
                    status = "(не удалось проверить)"
            self.stdout.write(f"  - {table} {status}")
        
        # Группируем по типам
        services_tables = [t for t in extra_tables if t.startswith('services_')]
        accounts_extra_tables = [t for t in extra_tables if t.startswith('accounts_') and t not in expected_tables]
        other_tables = [t for t in extra_tables if not t.startswith('services_') and not (t.startswith('accounts_') and t not in expected_tables)]
        
        if services_tables:
            self.stdout.write(f"\nТаблицы от приложения 'services' ({len(services_tables)}):")
            self.stdout.write("     Приложение НЕ в INSTALLED_APPS и больше не используется.")
        
        if accounts_extra_tables:
            self.stdout.write(f"\nЛишние таблицы accounts ({len(accounts_extra_tables)}):")
            self.stdout.write("     Созданы Django для кастомной модели User, но не используются.")
            self.stdout.write("     Django использует стандартные auth_user_* таблицы.")
        
        if other_tables:
            self.stdout.write(f"\nДругие лишние таблицы ({len(other_tables)}):")
            self.stdout.write("     Не относятся ни к одному установленному приложению.")
        
        if not options['confirm']:
            self.stdout.write("\n" + "=" * 70)
            self.stdout.write(self.style.WARNING(
                "РЕЖИМ ПРЕДПРОСМОТРА\n"
                "Ничего не удалено. Для реального удаления запустите:\n"
                "  python manage.py cleanup_db_tables --confirm"
            ))
            return
        
        # Реальное удаление
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.WARNING("НАЧИНАЮ УДАЛЕНИЕ ЛИШНИХ ТАБЛИЦ..."))
        self.stdout.write("=" * 70)
        
        deleted_count = 0
        errors = []
        
        with connection.cursor() as cursor:
            for table in sorted(extra_tables):
                try:
                    # Удаляем таблицу с CASCADE (удалит и связанные объекты)
                    cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE;')
                    deleted_count += 1
                    self.stdout.write(self.style.SUCCESS(f"  Удалена: {table}"))
                except Exception as e:
                    error_msg = f"  Ошибка при удалении {table}: {e}"
                    errors.append(error_msg)
                    self.stdout.write(self.style.ERROR(error_msg))
        
        connection.commit()
        
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.SUCCESS(f"Удалено таблиц: {deleted_count}"))
        if errors:
            self.stdout.write(self.style.WARNING(f"Ошибок: {len(errors)}"))
        
        # Показываем финальную статистику
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE';
            """)
            final_count = cursor.fetchone()[0]
        
        self.stdout.write(f"\nФинальная статистика:")
        self.stdout.write(f"  - Таблиц в БД после очистки: {final_count}")
        self.stdout.write(f"  - Ожидаемых таблиц: {len(expected_tables)}")
        
        if final_count == len(expected_tables):
            self.stdout.write(self.style.SUCCESS("\nБД полностью очищена! Все лишние таблицы удалены."))
        else:
            self.stdout.write(self.style.WARNING(f"\nВ БД осталось {final_count - len(expected_tables)} лишних таблиц."))
        
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write("\nУстановленные приложения (таблицы от них сохранены):")
        local_apps = [app for app in settings.INSTALLED_APPS 
                      if not app.startswith('django.') 
                      and not app.startswith('rest_framework') 
                      and not app.startswith('corsheaders') 
                      and not app.startswith('django_filters')]
        for app in local_apps:
            self.stdout.write(f"  - {app}")
        
        self.stdout.write("\n" + "=" * 70)


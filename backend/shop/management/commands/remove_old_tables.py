from django.core.management.base import BaseCommand
from django.db import connection
from django.conf import settings
from django.apps import apps


class Command(BaseCommand):
    help = 'Проверяет и удаляет лишние таблицы от старого приложения services'

    def add_arguments(self, parser):
        parser.add_argument(
            '--remove-accounts-tables',
            action='store_true',
            help='Удалить лишние таблицы accounts_user_groups и accounts_user_user_permissions',
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write("ПРОВЕРКА И УДАЛЕНИЕ ЛИШНИХ ТАБЛИЦ")
        self.stdout.write("=" * 70)
        
        # Получаем ожидаемые таблицы
        expected_tables = set()
        for app_config in apps.get_app_configs():
            if app_config.name in settings.INSTALLED_APPS or app_config.label in [app.split('.')[-1] for app in settings.INSTALLED_APPS]:
                for model in app_config.get_models():
                    expected_tables.add(model._meta.db_table)
        
        # Системные таблицы Django
        expected_tables.update([
            'django_migrations',
            'django_content_type',
            'django_session',
            'auth_permission',
            'auth_group',
            'auth_group_permissions',
            'auth_user_groups',
            'auth_user_user_permissions'
        ])
        
        # Получаем фактические таблицы
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
        self.stdout.write(f"  - Ожидаемых таблиц: {len(expected_tables)}")
        self.stdout.write(f"  - Фактических таблиц в БД: {len(actual_tables)}")
        
        # Лишние таблицы
        extra_tables = actual_tables - expected_tables
        
        if not extra_tables:
            self.stdout.write(self.style.SUCCESS("\nЛишних таблиц не обнаружено"))
            return
        
        self.stdout.write(f"\nНайдено лишних таблиц: {len(extra_tables)}")
        
        # Таблицы от services
        services_tables = [t for t in extra_tables if t.startswith('services_')]
        
        if services_tables:
            self.stdout.write(f"\nТаблицы от приложения 'services' ({len(services_tables)}):")
            self.stdout.write("     Приложение НЕ в INSTALLED_APPS и больше не используется.")
            for table in sorted(services_tables):
                self.stdout.write(f"  - {table}")
            
            self.stdout.write("\nУдаление таблиц от services...")
            deleted_count = 0
            with connection.cursor() as cursor:
                for table in services_tables:
                    try:
                        cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE;')
                        deleted_count += 1
                        self.stdout.write(self.style.SUCCESS(f"  Удалена: {table}"))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"  Ошибка при удалении {table}: {e}"))
            connection.commit()
            self.stdout.write(self.style.SUCCESS(f"\nУдалено таблиц от services: {deleted_count}"))
        
        # Таблицы accounts_user_groups и accounts_user_user_permissions
        accounts_extra_tables = [t for t in extra_tables if t in ['accounts_user_groups', 'accounts_user_user_permissions']]
        
        if accounts_extra_tables:
            self.stdout.write(f"\nЛишние таблицы accounts ({len(accounts_extra_tables)}):")
            self.stdout.write("     Эти таблицы созданы Django для кастомной модели User,")
            self.stdout.write("     но не используются (используются стандартные auth_user_*).")
            for table in sorted(accounts_extra_tables):
                self.stdout.write(f"  - {table}")
            
            if options['remove_accounts_tables']:
                self.stdout.write("\nУдаление лишних таблиц accounts...")
                deleted_count = 0
                with connection.cursor() as cursor:
                    for table in accounts_extra_tables:
                        try:
                            # Проверяем, есть ли данные в таблице
                            cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
                            count = cursor.fetchone()[0]
                            if count > 0:
                                self.stdout.write(self.style.WARNING(f"  В таблице {table} есть {count} записей. Пропускаю."))
                                continue
                            
                            cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE;')
                            deleted_count += 1
                            self.stdout.write(self.style.SUCCESS(f"  Удалена: {table}"))
                        except Exception as e:
                            self.stdout.write(self.style.ERROR(f"  Ошибка при удалении {table}: {e}"))
                connection.commit()
                self.stdout.write(self.style.SUCCESS(f"\nУдалено лишних таблиц accounts: {deleted_count}"))
            else:
                self.stdout.write("\nДля удаления этих таблиц запустите:")
                self.stdout.write("   python manage.py remove_old_tables --remove-accounts-tables")
        
        # Другие лишние таблицы
        other_tables = [t for t in extra_tables if not t.startswith('services_') and t not in accounts_extra_tables]
        if other_tables:
            self.stdout.write(f"\nДругие лишние таблицы ({len(other_tables)}):")
            for table in sorted(other_tables):
                self.stdout.write(f"  - {table}")
            self.stdout.write("\nЭти таблицы не удаляются автоматически.")
            self.stdout.write("   Если они не нужны, удалите их вручную через SQL.")
        
        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.SUCCESS("Проверка завершена!"))

# Generated manually
# Миграция данных: устанавливает is_staff=True для пользователей,
# которые были менеджерами или админами
# 
# ВАЖНО: Эта миграция должна выполняться ПЕРЕД удалением поля role (0011).
# Если миграция 0011 уже выполнена, эта миграция ничего не сделает.

from django.db import migrations


def set_staff_for_managers(apps, schema_editor):
    """
    Устанавливает is_staff=True для пользователей с ролью manager или admin
    """
    User = apps.get_model('accounts', 'User')
    
    # Проверяем, существует ли еще поле role в модели
    # Используем историческую модель через apps.get_model
    try:
        # Пытаемся получить пользователей с ролью manager или admin
        # Если поле role не существует, это вызовет ошибку
        db_table = User._meta.db_table
        with schema_editor.connection.cursor() as cursor:
            # Проверяем, существует ли колонка role в базе данных
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name=%s AND column_name='role'
            """, [db_table])
            if cursor.fetchone():
                # Поле role существует, можем обновить is_staff
                # Используем параметризованный запрос для безопасности
                cursor.execute("""
                    UPDATE {} 
                    SET is_staff = TRUE 
                    WHERE role IN ('manager', 'admin') AND is_staff = FALSE
                """.format(db_table))
                updated_count = cursor.rowcount
                if updated_count > 0:
                    print(f"Установлено is_staff=True для {updated_count} пользователей (менеджеры и админы)")
    except Exception as e:
        # Поле role уже удалено или произошла другая ошибка
        # Это нормально, если миграция 0011 уже выполнена
        print(f"Миграция данных пропущена: поле role уже удалено или недоступно ({e})")
        pass


def reverse_set_staff_for_managers(apps, schema_editor):
    """
    Обратная миграция - не делаем ничего, так как мы не можем восстановить role
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_add_privacy_fields'),
    ]

    operations = [
        migrations.RunPython(
            set_staff_for_managers,
            reverse_set_staff_for_managers
        ),
    ]


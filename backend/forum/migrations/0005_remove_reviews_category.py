# Generated manually

from django.db import migrations


def remove_reviews_category(apps, schema_editor):
    """
    Удаляет категорию "Отзывы"
    """
    ForumCategory = apps.get_model('forum', 'ForumCategory')
    
    try:
        category = ForumCategory.objects.get(slug='reviews')
        category.delete()
    except ForumCategory.DoesNotExist:
        # Категория уже удалена или не существует
        pass


def reverse_remove_reviews_category(apps, schema_editor):
    """
    Обратная миграция - восстанавливает категорию "Отзывы"
    """
    ForumCategory = apps.get_model('forum', 'ForumCategory')
    
    ForumCategory.objects.get_or_create(
        slug='reviews',
        defaults={
            'name': 'Отзывы',
            'description': 'Отзывы о тюнинг-студиях, запчастях и модификациях',
            'order': 3,
            'is_active': True
        }
    )


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0003_create_forum_categories'),
    ]

    operations = [
        migrations.RunPython(
            remove_reviews_category,
            reverse_remove_reviews_category
        ),
    ]


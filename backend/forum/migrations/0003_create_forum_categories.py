# Generated manually

from django.db import migrations


def create_forum_categories(apps, schema_editor):
    """
    Создает категории форума
    """
    ForumCategory = apps.get_model('forum', 'ForumCategory')
    
    categories_data = [
        {
            'name': 'Тюнинг',
            'slug': 'tuning',
            'description': 'Обсуждение тюнинга автомобилей, доработок и модификаций',
            'order': 1,
            'is_active': True
        },
        {
            'name': 'Запчасти',
            'slug': 'parts',
            'description': 'Вопросы о запчастях, ремонте и обслуживании автомобилей',
            'order': 2,
            'is_active': True
        },
        {
            'name': 'Общие обсуждения',
            'slug': 'general',
            'description': 'Общие вопросы и обсуждения на автомобильную тематику',
            'order': 3,
            'is_active': True
        },
        {
            'name': 'Дрифт и гонки',
            'slug': 'drift-racing',
            'description': 'Обсуждение дрифта, гонок и спортивного вождения',
            'order': 4,
            'is_active': True
        },
        {
            'name': 'Аудио и мультимедиа',
            'slug': 'audio',
            'description': 'Установка аудиосистем, магнитол, сабвуферов и мультимедиа',
            'order': 5,
            'is_active': True
        },
        {
            'name': 'Шины и диски',
            'slug': 'wheels-tires',
            'description': 'Обсуждение шин, дисков, резины и колесных комплектов',
            'order': 6,
            'is_active': True
        },
        {
            'name': 'Электроника',
            'slug': 'electronics',
            'description': 'Автоэлектроника, сигнализации, камеры и гаджеты',
            'order': 7,
            'is_active': True
        },
        {
            'name': 'Кузов и покраска',
            'slug': 'body-paint',
            'description': 'Кузовные работы, покраска, винил и оклейка',
            'order': 8,
            'is_active': True
        },
        {
            'name': 'Продажа и покупка',
            'slug': 'buy-sell',
            'description': 'Продажа и покупка автомобилей, запчастей и аксессуаров',
            'order': 9,
            'is_active': True
        },
    ]
    
    for cat_data in categories_data:
        ForumCategory.objects.get_or_create(
            slug=cat_data['slug'],
            defaults=cat_data
        )


def reverse_create_forum_categories(apps, schema_editor):
    """
    Обратная миграция - удаляет созданные категории
    """
    ForumCategory = apps.get_model('forum', 'ForumCategory')
    slugs = ['tuning', 'parts', 'general', 'drift-racing', 'audio', 
             'wheels-tires', 'electronics', 'body-paint', 'buy-sell']
    ForumCategory.objects.filter(slug__in=slugs).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('forum', '0002_forumimage'),
    ]

    operations = [
        migrations.RunPython(
            create_forum_categories,
            reverse_create_forum_categories
        ),
    ]


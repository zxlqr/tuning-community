"""
Management команда для генерации тестовых данных форума

Создает реалистичные данные: пользователей, темы, посты и лайки
для наполнения форума и создания ощущения живого сообщества.

Использование:
    python manage.py generate_forum_data [--topics N] [--posts-per-topic N] [--users N]
    
Примеры:
    python manage.py generate_forum_data
    python manage.py generate_forum_data --topics 50 --posts-per-topic 10 --users 20
"""
import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from forum.models import ForumCategory, ForumTopic, ForumPost, ForumLike

User = get_user_model()


# Реалистичные данные для генерации
FORUM_TOPICS = [
    # Тюнинг
    {
        'title': 'Какой выхлоп лучше поставить на BMW E46?',
        'content': 'Ребят, хочу поставить новый выхлоп на свою E46. Смотрю варианты: Remus, Supersprint, или может что-то кастомное? Кто что ставил, поделитесь опытом. Нужен не слишком громкий, но чтобы звучал агрессивно.',
        'category_slug': 'tuning'
    },
    {
        'title': 'Установка спойлера - нужен ли он?',
        'content': 'Думаю поставить спойлер на багажник. Многие говорят что это только для красоты, но может быть есть реальная польза на высоких скоростях?',
        'category_slug': 'tuning'
    },
    {
        'title': 'Тюнинг двигателя - с чего начать?',
        'content': 'Хочу немного поднять мощность двигателя. С чего лучше начать? Чип-тюнинг, воздушный фильтр, или может сразу турбо? Бюджет ограничен.',
        'category_slug': 'tuning'
    },
    {
        'title': 'Койловеры или пружины? Что выбрать?',
        'content': 'Планирую опустить машину, но не могу определиться. Койловеры дороже, но регулируемые. Пружины дешевле, но жесткость не изменить. Кто что ставил? Какой опыт?',
        'category_slug': 'tuning'
    },
    {
        'title': 'Покраска дисков в матовый черный - стоит ли?',
        'content': 'Хочу покрасить свои литые диски в матовый черный. Машина белая. Кто красил? Как долго держится? Не отвалится ли краска через год?',
        'category_slug': 'tuning'
    },
    {
        'title': 'Установка спойлера - нужен ли он?',
        'content': 'Думаю поставить спойлер на багажник. Многие говорят что это только для красоты, но может быть есть реальная польза на высоких скоростях?',
        'category_slug': 'tuning'
    },
    {
        'title': 'Тюнинг двигателя - с чего начать?',
        'content': 'Хочу немного поднять мощность двигателя. С чего лучше начать? Чип-тюнинг, воздушный фильтр, или может сразу турбо? Бюджет ограничен.',
        'category_slug': 'tuning'
    },
    
    # Запчасти
    {
        'title': 'Где купить оригинальные запчасти для Mercedes?',
        'content': 'Нужны оригинальные запчасти для W204. В официальном сервисе очень дорого. Может кто знает проверенные магазины или сайты с нормальными ценами?',
        'category_slug': 'parts'
    },
    {
        'title': 'Тормозные колодки - какие лучше?',
        'content': 'Пришло время менять тормозные колодки. Смотрю варианты: Brembo, Textar, или может оригинал? Кто что ставил? Как ведут себя в дождь?',
        'category_slug': 'parts'
    },
    {
        'title': 'Проблема с АКПП - что может быть?',
        'content': 'Машина начала дергаться при переключении передач. АКПП 6-ступенчатая. Масло менял недавно. Может кто сталкивался? Что проверять?',
        'category_slug': 'parts'
    },
    {
        'title': 'Замена ремня ГРМ - можно ли самому?',
        'content': 'Нужно заменить ремень ГРМ. Пробег 120к. Хочу попробовать сам, но боюсь что-то напортачить. Кто делал сам? Сложно ли?',
        'category_slug': 'parts'
    },
    {
        'title': 'Масло для двигателя - какое выбрать?',
        'content': 'Подскажите какое масло лучше заливать? Машина 2015 года, пробег 80к. В сервисе предлагают синтетику 5W-30, но может есть варианты лучше?',
        'category_slug': 'parts'
    },
    
    # Общие обсуждения
    {
        'title': 'Какая машина лучше для города?',
        'content': 'Хочу купить машину для города. Рассматриваю хэтчбек или седан. Важна экономичность и маневренность. Что посоветуете?',
        'category_slug': 'general'
    },
    {
        'title': 'Первый автомобиль - что выбрать?',
        'content': 'Получаю права, хочу купить первую машину. Бюджет до 500к. Что лучше взять? Может кто поделится опытом?',
        'category_slug': 'general'
    },
    {
        'title': 'Как подготовить машину к зиме?',
        'content': 'Первая зима за рулем. Что нужно проверить и подготовить? Масло, антифриз, шины - что еще?',
        'category_slug': 'general'
    },
    {
        'title': 'Страховка ОСАГО - где дешевле?',
        'content': 'Нужно продлить ОСАГО. Где сейчас самые выгодные тарифы? Может кто недавно оформлял?',
        'category_slug': 'general'
    },
    {
        'title': 'Парковка в центре города - где оставить?',
        'content': 'Часто езжу в центр, но не знаю где парковаться. Все платные парковки или можно найти бесплатные места?',
        'category_slug': 'general'
    },
    
    # Дрифт и гонки
    {
        'title': 'Первая дрифт-встреча - что нужно знать?',
        'content': 'Хочу поехать на дрифт-встречу впервые. Что нужно подготовить? Какие требования к машине? Может кто поделится опытом?',
        'category_slug': 'drift-racing'
    },
    {
        'title': 'Лучшие трассы для дрифта в регионе',
        'content': 'Ищу хорошие места для дрифта. Кто знает безопасные площадки или трассы? Поделитесь координатами!',
        'category_slug': 'drift-racing'
    },
    
    # Аудио и мультимедиа
    {
        'title': 'Какую магнитолу выбрать?',
        'content': 'Хочу поменять штатную магнитолу. Нужен Android Auto, хороший звук. Что посоветуете? Бюджет до 30к.',
        'category_slug': 'audio'
    },
    {
        'title': 'Установка сабвуфера - стоит ли?',
        'content': 'Думаю поставить сабвуфер в багажник. Насколько это улучшит звук? Не будет ли слишком громко?',
        'category_slug': 'audio'
    },
    
    # Шины и диски
    {
        'title': 'Зимняя резина - какая лучше?',
        'content': 'Нужно купить зимнюю резину. Смотрю варианты: Nokian, Michelin, Bridgestone. Что выбрать для наших дорог?',
        'category_slug': 'wheels-tires'
    },
    {
        'title': 'Литые или кованые диски?',
        'content': 'Планирую купить новые диски. Не могу определиться между литыми и коваными. В чем разница кроме цены?',
        'category_slug': 'wheels-tires'
    },
    
    # Электроника
    {
        'title': 'Какая сигнализация лучше?',
        'content': 'Нужна хорошая сигнализация с автозапуском. Что посоветуете? Важна надежность и хорошая дальность брелока.',
        'category_slug': 'electronics'
    },
    {
        'title': 'Установка камеры заднего вида',
        'content': 'Хочу поставить камеру заднего вида. Можно ли установить самому или лучше в сервис? Какая модель хорошая?',
        'category_slug': 'electronics'
    },
    
    # Кузов и покраска
    {
        'title': 'Виниловая оклейка - сколько стоит?',
        'content': 'Хочу сделать виниловую оклейку кузова. Сколько примерно стоит полная оклейка? Какие материалы лучше?',
        'category_slug': 'body-paint'
    },
    {
        'title': 'Покраска бампера - где сделать?',
        'content': 'Поцарапал бампер, нужно покрасить. Может кто знает хороший сервис с нормальными ценами?',
        'category_slug': 'body-paint'
    },
    
    # Продажа и покупка
    {
        'title': 'Продаю диски R17',
        'content': 'Продаю комплект литых дисков R17, 5x114.3. Состояние отличное, без царапин. Цена договорная.',
        'category_slug': 'buy-sell'
    },
    {
        'title': 'Ищу оригинальные фары для E46',
        'content': 'Ищу оригинальные фары для BMW E46 в хорошем состоянии. Может у кого-то есть или знаете где купить?',
        'category_slug': 'buy-sell'
    },
]

POST_REPLIES = [
    'Согласен с тобой! У меня похожий опыт.',
    'Интересная мысль, не думал об этом раньше.',
    'А я делал по-другому, но твой вариант тоже имеет смысл.',
    'Спасибо за совет, обязательно попробую!',
    'У меня была похожая ситуация, решил так...',
    'Хороший вопрос, сам думал об этом.',
    'Могу поделиться своим опытом, если интересно.',
    'Попробуй еще вот такой вариант, может поможет.',
    'Столкнулся с такой же проблемой недавно.',
    'Отличная идея! Обязательно попробую.',
    'Не согласен, у меня другой опыт.',
    'Может быть стоит еще вот что учесть...',
    'Я бы посоветовал сначала проверить...',
    'У меня похожая ситуация, но я сделал так...',
    'Интересно, а что если попробовать...',
    'Хороший совет, спасибо!',
    'А я слышал что лучше делать так...',
    'Попробуй обратиться туда, мне помогли.',
    'У меня была такая же проблема, решил вот так.',
    'Согласен, это действительно важно учесть.',
]

USERNAMES = [
    'SpeedDemon', 'CarLover', 'TuningPro', 'AutoMaster', 'DriftKing',
    'TurboBoost', 'RacingFan', 'CarEnthusiast', 'MotorHead', 'SpeedRacer',
    'TunerPro', 'AutoGuru', 'CarFreak', 'SpeedAddict', 'MotorManiac',
    'TuningExpert', 'AutoFan', 'RacingPro', 'CarMaster', 'SpeedJunkie',
    'TurboFan', 'AutoLover', 'TuningMaster', 'CarPro', 'RacingAddict',
]


class Command(BaseCommand):
    help = 'Генерирует тестовые данные для форума (пользователи, темы, посты, лайки)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--topics',
            type=int,
            default=30,
            help='Количество тем для создания (по умолчанию: 30)'
        )
        parser.add_argument(
            '--posts-per-topic',
            type=int,
            default=5,
            help='Среднее количество постов на тему (по умолчанию: 5)'
        )
        parser.add_argument(
            '--users',
            type=int,
            default=15,
            help='Количество пользователей для создания (по умолчанию: 15)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Удалить все существующие данные форума перед генерацией'
        )

    def handle(self, *args, **options):
        topics_count = options['topics']
        posts_per_topic = options['posts_per_topic']
        users_count = options['users']
        clear = options['clear']

        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Генерация тестовых данных для форума'))
        self.stdout.write(self.style.SUCCESS('=' * 60))

        # Очистка данных если нужно
        if clear:
            self.stdout.write(self.style.WARNING('Удаление существующих данных...'))
            ForumLike.objects.all().delete()
            ForumPost.objects.all().delete()
            ForumTopic.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Данные удалены'))

        # Получаем или создаем категории
        categories = self._ensure_categories()

        # Создаем пользователей
        users = self._create_users(users_count)

        # Создаем темы
        topics = self._create_topics(categories, users, topics_count)

        # Создаем посты
        posts = self._create_posts(topics, users, posts_per_topic)

        # Создаем лайки
        self._create_likes(posts, users)

        # Обновляем счетчики просмотров
        self._update_view_counts(topics)

        self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
        self.stdout.write(self.style.SUCCESS('Генерация завершена успешно!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'Создано пользователей: {len(users)}')
        self.stdout.write(f'Создано тем: {len(topics)}')
        self.stdout.write(f'Создано постов: {len(posts)}')
        self.stdout.write(f'Создано лайков: {ForumLike.objects.count()}')

    def _ensure_categories(self):
        """Создает категории форума если их нет"""
        # Получаем все существующие категории
        categories = list(ForumCategory.objects.filter(is_active=True).order_by('order'))
        
        if not categories:
            # Если категорий нет, создаем их
            categories_data = [
                {'name': 'Тюнинг', 'slug': 'tuning', 'description': 'Обсуждение тюнинга автомобилей, доработок и модификаций', 'order': 1},
                {'name': 'Запчасти', 'slug': 'parts', 'description': 'Вопросы о запчастях, ремонте и обслуживании автомобилей', 'order': 2},
                {'name': 'Общие обсуждения', 'slug': 'general', 'description': 'Общие вопросы и обсуждения на автомобильную тематику', 'order': 4},
                {'name': 'Дрифт и гонки', 'slug': 'drift-racing', 'description': 'Обсуждение дрифта, гонок и спортивного вождения', 'order': 5},
                {'name': 'Аудио и мультимедиа', 'slug': 'audio', 'description': 'Установка аудиосистем, магнитол, сабвуферов и мультимедиа', 'order': 6},
                {'name': 'Шины и диски', 'slug': 'wheels-tires', 'description': 'Обсуждение шин, дисков, резины и колесных комплектов', 'order': 7},
                {'name': 'Электроника', 'slug': 'electronics', 'description': 'Автоэлектроника, сигнализации, камеры и гаджеты', 'order': 8},
                {'name': 'Кузов и покраска', 'slug': 'body-paint', 'description': 'Кузовные работы, покраска, винил и оклейка', 'order': 9},
                {'name': 'Продажа и покупка', 'slug': 'buy-sell', 'description': 'Продажа и покупка автомобилей, запчастей и аксессуаров', 'order': 10},
            ]
            
            for cat_data in categories_data:
                category, created = ForumCategory.objects.get_or_create(
                    slug=cat_data['slug'],
                    defaults=cat_data
                )
                categories.append(category)
                if created:
                    self.stdout.write(self.style.SUCCESS(f'Создана категория: {category.name}'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Найдено категорий: {len(categories)}'))

        return categories

    def _create_users(self, count):
        """Создает тестовых пользователей"""
        existing_users = list(User.objects.all())
        new_users = []

        # Используем существующих пользователей
        if existing_users:
            new_users.extend(existing_users[:min(count, len(existing_users))])

        # Создаем новых пользователей если нужно
        needed = count - len(new_users)
        if needed > 0:
            available_usernames = [u for u in USERNAMES if not User.objects.filter(username=u).exists()]
            random.shuffle(available_usernames)

            for i in range(needed):
                username = available_usernames[i] if i < len(available_usernames) else f'user_{random.randint(1000, 9999)}'
                email = f'{username.lower()}@example.com'
                
                if not User.objects.filter(username=username).exists():
                    user = User.objects.create_user(
                        username=username,
                        email=email,
                        password='testpass123',
                        first_name=random.choice(['Алексей', 'Дмитрий', 'Иван', 'Максим', 'Сергей', 'Андрей', 'Николай', 'Владимир']),
                        last_name=random.choice(['Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Лебедев']),
                    )
                    new_users.append(user)
                    self.stdout.write(f'Создан пользователь: {username}')

        return new_users[:count]

    def _create_topics(self, categories, users, count):
        """Создает темы форума"""
        topics = []
        category_dict = {cat.slug: cat for cat in categories}

        # Используем готовые темы из списка
        available_topics = FORUM_TOPICS.copy()
        random.shuffle(available_topics)

        for i in range(count):
            if i < len(available_topics):
                topic_data = available_topics[i]
                category = category_dict.get(topic_data['category_slug'], categories[0])
            else:
                # Генерируем случайную тему
                category = random.choice(categories)
                topic_data = {
                    'title': f'Тема обсуждения #{i+1}',
                    'content': f'Это тестовая тема для обсуждения различных вопросов, связанных с автомобилями и тюнингом.',
                    'category_slug': category.slug
                }

            # Случайная дата создания (от 30 дней назад до сейчас)
            days_ago = random.randint(0, 30)
            created_at = timezone.now() - timedelta(days=days_ago, hours=random.randint(0, 23))

            topic = ForumTopic.objects.create(
                category=category,
                author=random.choice(users),
                title=topic_data['title'],
                content=topic_data['content'],
                is_pinned=random.random() < 0.1,  # 10% закрепленных
                is_locked=random.random() < 0.05,  # 5% закрытых
                views_count=random.randint(10, 500),
                created_at=created_at,
            )
            topics.append(topic)

        self.stdout.write(self.style.SUCCESS(f'Создано тем: {len(topics)}'))
        return topics

    def _create_posts(self, topics, users, avg_posts_per_topic):
        """Создает посты в темах"""
        all_posts = []

        for topic in topics:
            # Количество постов в теме (случайное, но в среднем avg_posts_per_topic)
            posts_count = max(0, int(random.gauss(avg_posts_per_topic, 2)))

            # Первый пост - это само содержание темы, не создаем его отдельно
            # Создаем ответы на тему
            for i in range(posts_count):
                # Время создания поста (после создания темы, но не в будущем)
                days_after_topic = random.randint(0, min(30, (timezone.now() - topic.created_at).days))
                hours_offset = random.randint(0, 23)
                created_at = topic.created_at + timedelta(days=days_after_topic, hours=hours_offset)

                # Выбираем случайный ответ из списка или генерируем
                if random.random() < 0.7:  # 70% используют готовые ответы
                    content = random.choice(POST_REPLIES)
                else:
                    content = f'Интересная тема! Хочу поделиться своим опытом. {random.choice(POST_REPLIES)}'

                post = ForumPost.objects.create(
                    topic=topic,
                    author=random.choice(users),
                    content=content,
                    is_edited=random.random() < 0.1,  # 10% отредактированных
                    created_at=created_at,
                )
                all_posts.append(post)

        self.stdout.write(self.style.SUCCESS(f'Создано постов: {len(all_posts)}'))
        return all_posts

    def _create_likes(self, posts, users):
        """Создает лайки для постов"""
        likes_count = 0

        for post in posts:
            # Количество лайков на пост (0-10, но большинство 0-3)
            num_likes = min(10, max(0, int(random.gauss(2, 1.5))))

            # Выбираем случайных пользователей для лайков
            likers = random.sample(users, min(num_likes, len(users)))

            for liker in likers:
                # Не ставим лайк на свой пост
                if liker != post.author:
                    like, created = ForumLike.objects.get_or_create(
                        post=post,
                        user=liker,
                        defaults={
                            'created_at': post.created_at + timedelta(
                                minutes=random.randint(1, 1440)  # В течение дня после поста
                            )
                        }
                    )
                    if created:
                        likes_count += 1

        self.stdout.write(self.style.SUCCESS(f'Создано лайков: {likes_count}'))

    def _update_view_counts(self, topics):
        """Обновляет счетчики просмотров тем"""
        for topic in topics:
            # Обновляем views_count на основе количества постов
            base_views = topic.posts.count() * random.randint(5, 20)
            topic.views_count = max(topic.views_count, base_views)
            topic.save(update_fields=['views_count'])


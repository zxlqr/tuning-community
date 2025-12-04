from django.core.management.base import BaseCommand
from django.db import models, transaction
from shop.models import Product, ProductVariant, ProductCategory, Order, OrderItem


class Command(BaseCommand):
    help = (
        "Удаляет тестовые/демо-данные из всех приложений.\n"
        "По умолчанию ТОЛЬКО показывает, что будет удалено.\n"
        "Для реального удаления добавьте флаг --confirm."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--confirm",
            action="store_true",
            help="Подтвердить удаление (без этого флага ничего не удаляется).",
        )

    def handle(self, *args, **options):
        confirm = options["confirm"]

        # Shop - все заказы и тестовые товары
        test_products = Product.objects.filter(
            models.Q(name__icontains="test")
            | models.Q(description__icontains="test")
            | models.Q(description__icontains="тест")
        )
        test_variants = ProductVariant.objects.filter(product__in=test_products)
        test_categories = ProductCategory.objects.filter(
            models.Q(name__icontains="test") | models.Q(name__icontains="тест")
        )
        all_orders = Order.objects.all()
        all_order_items = OrderItem.objects.all()

        # Bookings - все бронирования
        try:
            from bookings.models import Booking, BookingMedia, BookingComment
            all_bookings = Booking.objects.all()
            all_booking_media = BookingMedia.objects.all()
            all_booking_comments = BookingComment.objects.all()
        except ImportError:
            all_bookings = None
            all_booking_media = None
            all_booking_comments = None

        # Forum - тестовые темы и посты
        try:
            from forum.models import ForumTopic, ForumPost, ForumLike
            test_topics = ForumTopic.objects.filter(
                models.Q(title__icontains="test")
                | models.Q(title__icontains="тест")
                | models.Q(content__icontains="test")
                | models.Q(content__icontains="тест")
            )
            test_posts = ForumPost.objects.filter(
                models.Q(content__icontains="test") | models.Q(content__icontains="тест")
            )
            test_likes = ForumLike.objects.filter(post__in=test_posts)
        except ImportError:
            test_topics = None
            test_posts = None
            test_likes = None

        # Events - тестовые мероприятия
        try:
            from events.models import Event, EventRegistration
            test_events = Event.objects.filter(
                models.Q(title__icontains="test")
                | models.Q(title__icontains="тест")
                | models.Q(description__icontains="test")
                | models.Q(description__icontains="тест")
            )
            test_registrations = EventRegistration.objects.filter(event__in=test_events)
        except ImportError:
            test_events = None
            test_registrations = None

        # Loyalty - тестовые промокоды
        try:
            from loyalty.models import PromoCode, BonusTransaction
            test_promos = PromoCode.objects.filter(
                models.Q(code__icontains="test")
                | models.Q(code__icontains="тест")
                | models.Q(code__iexact="WELCOME10")
                | models.Q(code__iexact="SUMMER2024")
            )
            test_bonus_transactions = BonusTransaction.objects.filter(
                booking__isnull=False
            )
        except ImportError:
            test_promos = None
            test_bonus_transactions = None

        # Services - тестовые услуги и мастера
        try:
            from services.models import Service, ServicePackage, Master, WorkSlot
            test_services = Service.objects.filter(
                models.Q(name__icontains="test")
                | models.Q(name__icontains="тест")
                | models.Q(description__icontains="test")
                | models.Q(description__icontains="тест")
            )
            test_packages = ServicePackage.objects.filter(
                models.Q(name__icontains="test")
                | models.Q(name__icontains="тест")
            )
            test_masters = Master.objects.filter(
                models.Q(user__username__icontains="master")
                | models.Q(specialization__icontains="test")
            )
            test_work_slots = WorkSlot.objects.filter(master__in=test_masters)
        except ImportError:
            test_services = None
            test_packages = None
            test_masters = None
            test_work_slots = None

        # Accounts - тестовые пользователи (кроме админов)
        try:
            from accounts.models import User, Car, CarPhoto
            test_users = User.objects.filter(
                models.Q(username__icontains="test")
                | models.Q(username__icontains="тест")
                | models.Q(email__icontains="test")
                | models.Q(email__icontains="example.com")
                | models.Q(username__in=["master1", "master2"])
            ).exclude(is_superuser=True)
            test_cars = Car.objects.filter(user__in=test_users)
            test_car_photos = CarPhoto.objects.filter(car__in=test_cars)
        except ImportError:
            test_users = None
            test_cars = None
            test_car_photos = None

        # Выводим статистику
        self.stdout.write(self.style.MIGRATE_HEADING("Планируемая очистка данных:"))
        self.stdout.write("\nМагазин (Shop):")
        self.stdout.write(f"  - Заказы: {all_orders.count()}")
        self.stdout.write(f"  - Позиции в заказах: {all_order_items.count()}")
        self.stdout.write(f"  - Тестовые товары: {test_products.count()}")
        self.stdout.write(f"  - Варианты тестовых товаров: {test_variants.count()}")
        self.stdout.write(f"  - Тестовые категории: {test_categories.count()}")

        if all_bookings is not None:
            self.stdout.write("\nБронирования (Bookings):")
            self.stdout.write(f"  - Бронирования: {all_bookings.count()}")
            self.stdout.write(f"  - Медиа-файлы: {all_booking_media.count()}")
            self.stdout.write(f"  - Комментарии: {all_booking_comments.count()}")

        if test_topics is not None:
            self.stdout.write("\nФорум (Forum):")
            self.stdout.write(f"  - Тестовые темы: {test_topics.count()}")
            self.stdout.write(f"  - Тестовые посты: {test_posts.count()}")
            self.stdout.write(f"  - Лайки тестовых постов: {test_likes.count()}")

        if test_events is not None:
            self.stdout.write("\nМероприятия (Events):")
            self.stdout.write(f"  - Тестовые мероприятия: {test_events.count()}")
            self.stdout.write(f"  - Регистрации: {test_registrations.count()}")

        if test_promos is not None:
            self.stdout.write("\nБонусы (Loyalty):")
            self.stdout.write(f"  - Тестовые промокоды: {test_promos.count()}")
            self.stdout.write(f"  - Транзакции бонусов: {test_bonus_transactions.count()}")

        if test_services is not None:
            self.stdout.write("\nУслуги (Services):")
            self.stdout.write(f"  - Тестовые услуги: {test_services.count()}")
            self.stdout.write(f"  - Тестовые пакеты: {test_packages.count()}")
            self.stdout.write(f"  - Тестовые мастера: {test_masters.count()}")
            self.stdout.write(f"  - Рабочие посты: {test_work_slots.count()}")

        if test_users is not None:
            self.stdout.write("\nПользователи (Accounts):")
            self.stdout.write(f"  - Тестовые пользователи: {test_users.count()}")
            self.stdout.write(f"  - Машины тестовых пользователей: {test_cars.count()}")
            self.stdout.write(f"  - Фото машин: {test_car_photos.count()}")

        if not confirm:
            self.stdout.write("")
            self.stdout.write(
                self.style.WARNING(
                    "Ничего не удалено. Для реальной очистки запустите:\n"
                    "  python manage.py cleanup_demo_data --confirm"
                )
            )
            return

        # Реальное удаление
        self.stdout.write("")
        self.stdout.write(self.style.WARNING("Начинаю удаление..."))

        with transaction.atomic():
            # Shop
            deleted_items = all_order_items.delete()
            deleted_orders = all_orders.delete()
            deleted_variants = test_variants.delete()
            deleted_products = test_products.delete()
            deleted_categories = test_categories.delete()

            # Bookings
            if all_bookings is not None:
                deleted_booking_comments = all_booking_comments.delete()
                deleted_booking_media = all_booking_media.delete()
                deleted_bookings = all_bookings.delete()

            # Forum
            if test_topics is not None:
                deleted_likes = test_likes.delete()
                deleted_posts = test_posts.delete()
                deleted_topics = test_topics.delete()

            # Events
            if test_events is not None:
                deleted_registrations = test_registrations.delete()
                deleted_events = test_events.delete()

            # Loyalty
            if test_promos is not None:
                deleted_bonus_transactions = test_bonus_transactions.delete()
                deleted_promos = test_promos.delete()

            # Services
            if test_services is not None:
                deleted_work_slots = test_work_slots.delete()
                deleted_masters = test_masters.delete()
                deleted_packages = test_packages.delete()
                deleted_services = test_services.delete()

            # Accounts
            if test_users is not None:
                deleted_car_photos = test_car_photos.delete()
                deleted_cars = test_cars.delete()
                deleted_users = test_users.delete()

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Очистка выполнена!"))
        self.stdout.write("\nМагазин:")
        self.stdout.write(f"  - Удалено заказов: {deleted_orders[0]}")
        self.stdout.write(f"  - Удалено позиций: {deleted_items[0]}")
        self.stdout.write(f"  - Удалено товаров: {deleted_products[0]}")
        self.stdout.write(f"  - Удалено вариантов: {deleted_variants[0]}")
        self.stdout.write(f"  - Удалено категорий: {deleted_categories[0]}")

        if all_bookings is not None:
            self.stdout.write("\nБронирования:")
            self.stdout.write(f"  - Удалено бронирований: {deleted_bookings[0]}")
            self.stdout.write(f"  - Удалено медиа: {deleted_booking_media[0]}")
            self.stdout.write(f"  - Удалено комментариев: {deleted_booking_comments[0]}")

        if test_topics is not None:
            self.stdout.write("\nФорум:")
            self.stdout.write(f"  - Удалено тем: {deleted_topics[0]}")
            self.stdout.write(f"  - Удалено постов: {deleted_posts[0]}")
            self.stdout.write(f"  - Удалено лайков: {deleted_likes[0]}")

        if test_events is not None:
            self.stdout.write("\nМероприятия:")
            self.stdout.write(f"  - Удалено мероприятий: {deleted_events[0]}")
            self.stdout.write(f"  - Удалено регистраций: {deleted_registrations[0]}")

        if test_promos is not None:
            self.stdout.write("\nБонусы:")
            self.stdout.write(f"  - Удалено промокодов: {deleted_promos[0]}")
            self.stdout.write(f"  - Удалено транзакций: {deleted_bonus_transactions[0]}")

        if test_services is not None:
            self.stdout.write("\nУслуги:")
            self.stdout.write(f"  - Удалено услуг: {deleted_services[0]}")
            self.stdout.write(f"  - Удалено пакетов: {deleted_packages[0]}")
            self.stdout.write(f"  - Удалено мастеров: {deleted_masters[0]}")
            self.stdout.write(f"  - Удалено постов: {deleted_work_slots[0]}")

        if test_users is not None:
            self.stdout.write("\nПользователи:")
            self.stdout.write(f"  - Удалено пользователей: {deleted_users[0]}")
            self.stdout.write(f"  - Удалено машин: {deleted_cars[0]}")
            self.stdout.write(f"  - Удалено фото: {deleted_car_photos[0]}")



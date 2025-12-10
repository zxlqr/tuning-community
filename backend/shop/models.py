# Модели для магазина - товары, заказы, магазины
from django.db import models
from django.core.validators import MinValueValidator
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os


# Категории товаров - наклейки, футболки, аксессуары
class ProductCategory(models.Model):
    name = models.CharField(
        max_length=100,
        verbose_name='Название категории'
    )
    slug = models.SlugField(
        unique=True,
        verbose_name='URL-адрес'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок сортировки'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        verbose_name = 'Категория товара'
        verbose_name_plural = 'Категории товаров'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


# Товары в магазине - наклейки, одежда, аксессуары
class Product(models.Model):
    BRAND_CHOICES = [
        ('stputyxa', 'Stputyxa'),
        ('gohard', 'GO HARD'),
    ]
    
    PRODUCT_TYPE_CHOICES = [
        ('sticker', 'Наклейка'),
        ('clothing', 'Одежда'),
        ('accessory', 'Аксессуар'),
        ('other', 'Другое'),
    ]
    
    name = models.CharField(
        max_length=200,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание'
    )
    brand = models.CharField(
        max_length=50,
        choices=BRAND_CHOICES,
        default='stputyxa',
        verbose_name='Бренд/Магазин'
    )
    product_type = models.CharField(
        max_length=20,
        choices=PRODUCT_TYPE_CHOICES,
        default='other',
        verbose_name='Тип товара'
    )
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        related_name='products',
        verbose_name='Категория'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Цена'
    )
    image = models.ImageField(
        upload_to='shop/products/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Изображение'
    )
    stock_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Количество на складе'
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name='Доступен'
    )
    is_featured = models.BooleanField(
        default=False,
        verbose_name='Рекомендуемый'
    )
    # Поля для одежды
    is_clothing = models.BooleanField(
        default=False,
        verbose_name='Является одеждой'
    )
    characteristics = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Характеристики (JSON)'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Товар'
        verbose_name_plural = 'Товары'
        ordering = ['-is_featured', '-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def in_stock(self):
        # Проверяет есть ли товар на складе
        return self.stock_quantity > 0 and self.is_available
    
    @property
    def available_sizes(self):
        # Возвращает какие размеры есть для одежды
        if self.is_clothing and 'sizes' in self.characteristics:
            return self.characteristics['sizes']
        return []
    
    @property
    def available_colors(self):
        # Возвращает какие цвета есть для одежды
        if self.is_clothing and 'colors' in self.characteristics:
            return self.characteristics['colors']
        return []
    
    @property
    def size_chart(self):
        # Возвращает таблицу размеров для одежды
        if self.is_clothing and 'size_chart' in self.characteristics:
            return self.characteristics['size_chart']
        return {}


# Варианты товара - размеры и цвета для одежды
class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants',
        verbose_name='Товар'
    )
    size = models.CharField(
        max_length=10,
        blank=True,
        null=True,
        verbose_name='Размер'
    )
    color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Цвет'
    )
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        verbose_name='Цвет (HEX)'
    )
    stock_quantity = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Количество на складе'
    )
    price_modifier = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name='Наценка/скидка'
    )
    is_available = models.BooleanField(
        default=True,
        verbose_name='Доступен'
    )
    
    class Meta:
        verbose_name = 'Вариант товара'
        verbose_name_plural = 'Варианты товаров'
        unique_together = ['product', 'size', 'color']
    
    def __str__(self):
        parts = [str(self.product)]
        if self.size:
            parts.append(f"Размер: {self.size}")
        if self.color:
            parts.append(f"Цвет: {self.color}")
        return " - ".join(parts)
    
    @property
    def final_price(self):
        # Цена с учетом наценки или скидки
        return self.product.price + self.price_modifier
    
    @property
    def in_stock(self):
        # Проверяет есть ли этот вариант на складе
        return self.stock_quantity > 0 and self.is_available


# Заказы из магазина
class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('paid', 'Оплачен'),
        ('processing', 'В обработке'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]
    
    DELIVERY_METHOD_CHOICES = [
        ('delivery', 'Доставка'),
        ('pickup', 'Самовывоз'),
    ]
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='orders',
        verbose_name='Пользователь'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Статус'
    )
    delivery_method = models.CharField(
        max_length=20,
        choices=DELIVERY_METHOD_CHOICES,
        default='delivery',
        verbose_name='Способ получения'
    )
    delivery_address = models.TextField(
        blank=True,
        null=True,
        verbose_name='Адрес доставки'
    )
    customer_first_name = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Имя'
    )
    customer_last_name = models.CharField(
        max_length=100,
        default='',
        blank=True,
        verbose_name='Фамилия'
    )
    customer_middle_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Отчество'
    )
    customer_phone = models.CharField(
        max_length=20,
        default='',
        blank=True,
        verbose_name='Номер телефона'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Итоговая цена'
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Заметки'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Заказ #{self.id} от {self.user.username}"


# Товары в заказе
class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Заказ'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='order_items',
        verbose_name='Товар'
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        verbose_name='Количество'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Цена за единицу'
    )
    
    class Meta:
        verbose_name = 'Элемент заказа'
        verbose_name_plural = 'Элементы заказа'
    
    def __str__(self):
        return f"{self.product.name} x{self.quantity}"
    
    @property
    def total(self):
        # Считает сколько стоит этот товар (цена * количество)
        return self.quantity * self.price


# Магазин или бренд - показывается на главной странице магазина
class Shop(models.Model):
    name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Название магазина (необязательно)'
    )
    slug = models.SlugField(
        unique=True,
        blank=True,
        null=True,
        verbose_name='URL-адрес (slug, автозаполнение)'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание (необязательно)'
    )
    logo = models.ImageField(
        upload_to='shops/logos/%Y/%m/%d/',
        verbose_name='Логотип'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок сортировки'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Магазин'
        verbose_name_plural = 'Магазины'
        ordering = ['order', 'name']
    
    def __str__(self):
        if self.name:
            return self.name
        return f"Магазин #{self.id or 'новый'}"
    
    def save(self, *args, **kwargs):
        # Автоматически создает slug из названия или ID
        from django.utils.text import slugify
        
        if not self.slug:
            if self.name:
                base_slug = slugify(self.name)
                if not base_slug:
                    base_slug = f"shop-{self.id or 'new'}"
            else:
                base_slug = f"shop-{self.id or 'new'}"
            
            # Проверяем уникальность
            slug = base_slug
            counter = 1
            while Shop.objects.filter(slug=slug).exclude(pk=self.pk if self.pk else None).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        super().save(*args, **kwargs)
    
    @property
    def logo_url(self):
        # Возвращает ссылку на логотип
        if self.logo:
            return self.logo.url
        return None


# Корзина пользователя - хранится на сервере
class Cart(models.Model):
    user = models.OneToOneField(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='cart',
        verbose_name='Пользователь'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Корзина'
        verbose_name_plural = 'Корзины'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Корзина {self.user.username}"
    
    @property
    def total_items(self):
        # Считает общее количество товаров в корзине
        from django.db.models import Sum
        return self.items.aggregate(total=Sum('quantity'))['total'] or 0
    
    @property
    def total_price(self):
        # Считает общую стоимость корзины
        total = 0
        for item in self.items.all():
            item_price = item.variant.final_price if item.variant else item.product.price
            total += item_price * item.quantity
        return total


# Товары в корзине
class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='Корзина'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='Товар'
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='cart_items',
        blank=True,
        null=True,
        verbose_name='Вариант товара'
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        default=1,
        verbose_name='Количество'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Товар в корзине'
        verbose_name_plural = 'Товары в корзине'
        unique_together = ['cart', 'product', 'variant']
        ordering = ['-created_at']
    
    def __str__(self):
        variant_str = f" ({self.variant})" if self.variant else ""
        return f"{self.product.name}{variant_str} x{self.quantity}"
    
    @property
    def item_price(self):
        # Возвращает цену товара с учетом варианта
        if self.variant:
            return self.variant.final_price
        return self.product.price
    
    @property
    def total_price(self):
        # Возвращает общую стоимость этого товара (цена * количество)
        return self.item_price * self.quantity

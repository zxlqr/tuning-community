from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class BonusTransaction(models.Model):
    """
    Транзакции бонусных баллов
    """
    TRANSACTION_TYPE_CHOICES = [
        ('earned', 'Начислено'),
        ('spent', 'Потрачено'),
        ('expired', 'Истекло'),
        ('manual', 'Ручное начисление/списание'),
    ]
    
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='bonus_transactions',
        verbose_name='Пользователь'
    )
    # booking = models.ForeignKey(
    #     'bookings.Booking',
    #     on_delete=models.SET_NULL,
    #     blank=True,
    #     null=True,
    #     related_name='bonus_transactions',
    #     verbose_name='Заказ'
    # )
    points = models.IntegerField(
        verbose_name='Количество баллов'
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TRANSACTION_TYPE_CHOICES,
        verbose_name='Тип транзакции'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        verbose_name = 'Транзакция бонусов'
        verbose_name_plural = 'Транзакции бонусов'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.get_transaction_type_display()} {self.points} баллов"


class PromoCode(models.Model):
    """
    Промокоды
    """
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name='Код'
    )
    discount_percent = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Скидка в процентах (0 если используется фиксированная сумма)',
        verbose_name='Скидка %'
    )
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        help_text='Фиксированная скидка в рублях (0 если используется процент)',
        verbose_name='Скидка (руб.)'
    )
    min_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Минимальная сумма заказа'
    )
    max_uses = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        verbose_name='Максимум использований'
    )
    used_count = models.IntegerField(
        default=0,
        verbose_name='Количество использований'
    )
    valid_from = models.DateTimeField(
        verbose_name='Действителен с'
    )
    valid_until = models.DateTimeField(
        verbose_name='Действителен до'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активен'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        verbose_name = 'Промокод'
        verbose_name_plural = 'Промокоды'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.code
    
    def is_valid(self):
        """
        Проверка валидности промокода
        """
        if not self.is_active:
            return False
        if self.used_count >= self.max_uses:
            return False
        now = timezone.now()
        if now < self.valid_from or now > self.valid_until:
            return False
        return True
    
    def apply_discount(self, amount):
        """
        Применить скидку к сумме заказа
        """
        if not self.is_valid():
            return amount
        
        if amount < self.min_order_amount:
            return amount
        
        if self.discount_percent > 0:
            discount = amount * self.discount_percent / 100
            return max(0, amount - discount)
        elif self.discount_amount > 0:
            return max(0, amount - self.discount_amount)
        
        return amount


class Settings(models.Model):
    """
    Настройки системы (singleton)
    """
    bonus_points_per_rub = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.0,
        help_text='Баллов за 1 рубль покупки',
        verbose_name='Баллов за рубль'
    )
    bonus_points_to_rub = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.0,
        help_text='Сколько рублей за 1 балл (для расчета скидки)',
        verbose_name='Рублей за балл'
    )
    booking_advance_days = models.IntegerField(
        default=30,
        help_text='На сколько дней вперед можно бронировать',
        verbose_name='Дней вперед для бронирования'
    )
    working_hours_start = models.TimeField(
        default='09:00',
        verbose_name='Начало рабочего дня'
    )
    working_hours_end = models.TimeField(
        default='18:00',
        verbose_name='Конец рабочего дня'
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
        verbose_name = 'Настройки'
        verbose_name_plural = 'Настройки'
    
    def __str__(self):
        return 'Настройки системы'
    
    def save(self, *args, **kwargs):
        """
        Гарантируем, что будет только одна запись настроек
        """
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """
        Получить настройки (создать, если их нет)
        """
        settings, created = cls.objects.get_or_create(pk=1)
        return settings


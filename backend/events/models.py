# Модели для мероприятий и сходок
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


# Мероприятия и сходки
class Event(models.Model):
    EVENT_TYPE_CHOICES = [
        ('meetup', 'Сходка'),
        ('drift', 'Дрифт-встреча'),
        ('show', 'Автошоу'),
        ('race', 'Гонка'),
        ('other', 'Другое'),
    ]
    
    title = models.CharField(
        max_length=200,
        verbose_name='Название'
    )
    description = models.TextField(
        verbose_name='Описание'
    )
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default='meetup',
        verbose_name='Тип мероприятия'
    )
    location = models.CharField(
        max_length=200,
        verbose_name='Место проведения'
    )
    event_date = models.DateTimeField(
        verbose_name='Дата и время проведения'
    )
    registration_deadline = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Дедлайн регистрации'
    )
    max_participants = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1)],
        verbose_name='Максимум участников'
    )
    image = models.ImageField(
        upload_to='events/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Изображение'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активно'
    )
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_events',
        verbose_name='Создано пользователем'
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
        verbose_name = 'Мероприятие'
        verbose_name_plural = 'Мероприятия'
        ordering = ['event_date']
    
    def __str__(self):
        return self.title
    
    @property
    def participants_count(self):
        # Считает сколько человек зарегистрировалось
        return self.registrations.filter(is_attending=True).count()
    
    @property
    def is_registration_open(self):
        # Проверяет можно ли еще регистрироваться
        if not self.is_active:
            return False
        if self.registration_deadline:
            return timezone.now() < self.registration_deadline
        return True


class EventRegistration(models.Model):
    """
    Регистрации на мероприятия
    """
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='registrations',
        verbose_name='Мероприятие'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='event_registrations',
        verbose_name='Пользователь'
    )
    is_attending = models.BooleanField(
        default=True,
        verbose_name='Придет'
    )
    is_anonymous = models.BooleanField(
        default=False,
        verbose_name='Анонимная регистрация',
        help_text='Если включено, имя пользователя будет скрыто в списке участников'
    )
    car = models.ForeignKey(
        'accounts.Car',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='event_registrations',
        verbose_name='Автомобиль'
    )
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Заметки'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата регистрации'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Дата обновления'
    )
    
    class Meta:
        verbose_name = 'Регистрация на мероприятие'
        verbose_name_plural = 'Регистрации на мероприятия'
        unique_together = ['event', 'user']  # Один пользователь может зарегистрироваться только один раз
        ordering = ['-created_at']
    
    def __str__(self):
        if self.is_anonymous:
            return f"Анонимная регистрация на {self.event.title}"
        return f"{self.user.username} - {self.event.title}"

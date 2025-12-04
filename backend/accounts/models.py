# Модели для пользователей и их машин
from django.contrib.auth.models import AbstractUser
from django.db import models
from PIL import Image
import os
from django.core.files.base import ContentFile
from io import BytesIO


# Пользователь с настройками приватности
class User(AbstractUser):
    phone = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Телефон'
    )
    avatar = models.ImageField(
        upload_to='users/avatars/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Аватар'
    )
    # Настройки приватности
    is_phone_private = models.BooleanField(
        default=False,
        verbose_name='Скрыть телефон',
        help_text='Если включено, телефон не будет виден другим пользователям'
    )
    is_name_private = models.BooleanField(
        default=False,
        verbose_name='Скрыть имя и фамилию',
        help_text='Если включено, имя и фамилия не будут видны другим пользователям'
    )
    is_email_private = models.BooleanField(
        default=False,
        verbose_name='Скрыть email',
        help_text='Если включено, email не будет виден другим пользователям'
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
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username


class Badge(models.Model):
    """
    Бейджи/значки за участие в розыгрышах и мероприятиях
    """
    name = models.CharField(
        max_length=100,
        verbose_name='Название'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание'
    )
    icon = models.ImageField(
        upload_to='badges/',
        blank=True,
        null=True,
        verbose_name='Иконка'
    )
    event_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        verbose_name='Название события',
        help_text='Например: "Розыгрыш Chaser"'
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
        verbose_name = 'Бейдж'
        verbose_name_plural = 'Бейджи'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class UserBadge(models.Model):
    """
    Связь пользователя с бейджами
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='badges',
        verbose_name='Пользователь'
    )
    badge = models.ForeignKey(
        Badge,
        on_delete=models.CASCADE,
        related_name='users',
        verbose_name='Бейдж'
    )
    earned_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата получения'
    )
    
    class Meta:
        verbose_name = 'Бейдж пользователя'
        verbose_name_plural = 'Бейджи пользователей'
        unique_together = ['user', 'badge']  # Один пользователь может получить бейдж только один раз
        ordering = ['-earned_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.badge.name}"


class Car(models.Model):
    """
    Модель автомобиля клиента.
    
    Каждый клиент может иметь несколько автомобилей.
    Автомобили используются при создании бронирований услуг.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='cars',
        verbose_name='Владелец'
    )
    brand = models.CharField(
        max_length=100,
        verbose_name='Марка'
    )
    model = models.CharField(
        max_length=100,
        verbose_name='Модель'
    )
    generation = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Поколение/Кузов',
        help_text='Например: JZX90, E46, W210 и т.д.'
    )
    year = models.IntegerField(
        verbose_name='Год выпуска'
    )
    license_plate = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        verbose_name='Госномер'
    )
    vin = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        verbose_name='VIN-код'
    )
    color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name='Цвет'
    )
    photo = models.ImageField(
        upload_to='cars/%Y/%m/%d/',
        blank=True,
        null=True,
        verbose_name='Фото автомобиля',
        help_text='Фото будет автоматически обрезано до прямоугольного формата'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата добавления'
    )
    
    class Meta:
        verbose_name = 'Автомобиль'
        verbose_name_plural = 'Автомобили'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='car_user_created_idx'),
        ]
    
    def save(self, *args, **kwargs):
        """
        Переопределяем метод save для:
        1. Автоматического преобразования регистра для generation (jzx -> JZX)
        2. Обработки и обрезки изображения до прямоугольного формата
        """
        # Автоматическое преобразование регистра для generation
        if self.generation:
            # Преобразуем в верхний регистр, но сохраняем цифры
            # Например: jzx90 -> JZX90, e46 -> E46
            self.generation = self.generation.strip().upper()
        
        # Нормализуем регистр для brand и model (первая буква заглавная)
        if self.brand:
            self.brand = self.brand.strip().title()
        if self.model:
            self.model = self.model.strip().title()
        
        # Нормализуем госномер (убираем пробелы, приводим к верхнему регистру)
        if self.license_plate:
            self.license_plate = self.license_plate.strip().upper()
        
        # Нормализуем VIN (убираем пробелы, приводим к верхнему регистру)
        if self.vin:
            self.vin = self.vin.strip().upper()
        
        # Обрабатываем изображение, если оно было загружено
        # Проверяем, является ли это новым файлом
        if self.photo:
            photo_changed = False
            if not self.pk:
                # Новый объект - всегда обрабатываем
                photo_changed = True
            else:
                # Существующий объект - проверяем, изменилось ли фото
                try:
                    old_car = Car.objects.get(pk=self.pk)
                    if not old_car.photo or (hasattr(self.photo, 'name') and self.photo.name != old_car.photo.name):
                        photo_changed = True
                except Car.DoesNotExist:
                    photo_changed = True
            
            if photo_changed:
                try:
                    # Временно отключаем обработку изображения для отладки
                    # Раскомментируйте следующую строку, чтобы включить обработку:
                    # self.photo = self._process_image(self.photo)
                    pass  # Пока сохраняем изображение без обработки
                except Exception as e:
                    # Если обработка изображения не удалась, сохраняем без обработки
                    import logging
                    import traceback
                    logger = logging.getLogger(__name__)
                    logger.error(f'Ошибка обработки изображения: {e}')
                    logger.error(traceback.format_exc())
                    # Продолжаем сохранение без обработки изображения
                    # Изображение будет сохранено как есть
        
        super().save(*args, **kwargs)
    
    def _process_image(self, image):
        """
        Обрабатывает изображение: обрезает до прямоугольного формата (не широкого)
        Соотношение сторон 4:3 - вертикальный прямоугольник
        """
        # Открываем изображение
        # Для Django InMemoryUploadedFile или TemporaryUploadedFile
        if hasattr(image, 'file'):
            # Сохраняем текущую позицию
            if hasattr(image.file, 'seek'):
                current_pos = image.file.tell()
                image.file.seek(0)
            img = Image.open(image.file)
            # Возвращаемся в начало файла
            if hasattr(image.file, 'seek'):
                image.file.seek(0)
        elif hasattr(image, 'read'):
            # Обычный файловый объект
            current_pos = image.tell()
            image.seek(0)
            img = Image.open(image)
            image.seek(current_pos)
        else:
            # Путь к файлу или другой формат
            img = Image.open(image)
        
        # Конвертируем в RGB, если нужно
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        width, height = img.size
        
        # Целевое соотношение сторон (4:3 - не широкий прямоугольник)
        target_ratio = 4 / 3
        
        # Определяем, как обрезать изображение
        if width / height > target_ratio:
            # Изображение слишком широкое - обрезаем по ширине (центрируем)
            new_width = int(height * target_ratio)
            left = (width - new_width) // 2
            img = img.crop((left, 0, left + new_width, height))
        else:
            # Изображение слишком высокое - обрезаем по высоте (центрируем)
            new_height = int(width / target_ratio)
            top = (height - new_height) // 2
            img = img.crop((0, top, width, top + new_height))
        
        # Изменяем размер, если изображение слишком большое (максимум 1200x900)
        max_width = 1200
        max_height = 900
        if img.width > max_width or img.height > max_height:
            img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
        
        # Сохраняем обработанное изображение в буфер
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85, optimize=True)
        buffer.seek(0)
        
        # Создаем новое имя файла
        filename = os.path.basename(image.name) if hasattr(image, 'name') and image.name else 'car_photo.jpg'
        name, ext = os.path.splitext(filename)
        new_filename = f"{name}_processed.jpg"
        
        # Создаем новый файл с обработанным изображением
        image_file = ContentFile(buffer.read(), name=new_filename)
        buffer.close()
        
        # Заменяем содержимое исходного файла
        # Для Django InMemoryUploadedFile или TemporaryUploadedFile
        if hasattr(image, 'file'):
            image.file = image_file
            image.name = new_filename
        else:
            # Создаем новый объект файла
            image = image_file
        
        return image
    
    def __str__(self):
        # Возвращает название машины для отображения
        plate = self.license_plate if self.license_plate else "без номера"
        if self.generation:
            return f"{self.brand} {self.model} {self.generation} ({plate})"
        return f"{self.brand} {self.model} ({plate})"


class CarPhoto(models.Model):
    """
    Модель для хранения множественных фото автомобиля.
    
    Каждый автомобиль может иметь несколько фото.
    """
    car = models.ForeignKey(
        Car,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='Автомобиль'
    )
    photo = models.ImageField(
        upload_to='cars/photos/%Y/%m/%d/',
        verbose_name='Фото'
    )
    is_primary = models.BooleanField(
        default=False,
        verbose_name='Основное фото',
        help_text='Основное фото отображается на карточке автомобиля'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата загрузки'
    )
    
    class Meta:
        verbose_name = 'Фото автомобиля'
        verbose_name_plural = 'Фото автомобилей'
        ordering = ['-is_primary', '-created_at']
        indexes = [
            models.Index(fields=['car', '-is_primary', '-created_at'], name='car_photo_idx'),
        ]
    
    def __str__(self):
        return f"Фото {self.car.brand} {self.car.model} ({self.created_at.strftime('%d.%m.%Y')})"
    
    def save(self, *args, **kwargs):
        """
        При сохранении фото как основного, снимаем флаг is_primary с других фото этого автомобиля.
        """
        if self.is_primary and self.pk:
            # Если это новое фото или существующее, но мы делаем его основным
            CarPhoto.objects.filter(car=self.car, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        elif self.is_primary:
            # Если это новое фото и оно основное
            CarPhoto.objects.filter(car=self.car, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)

from django.db import models
from django.core.validators import MinLengthValidator


class ForumCategory(models.Model):
    """
    Категории форума (например: "Тюнинг", "Запчасти", "Отзывы")
    """
    name = models.CharField(
        max_length=100,
        verbose_name='Название категории',
        help_text='Название категории форума (например: "Тюнинг", "Запчасти")'
    )
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Описание',
        help_text='Краткое описание категории'
    )
    slug = models.SlugField(
        unique=True,
        verbose_name='URL-адрес',
        help_text='Уникальный идентификатор для URL (например: tuning, parts)'
    )
    order = models.IntegerField(
        default=0,
        verbose_name='Порядок сортировки',
        help_text='Порядок отображения категории в списке (меньше = выше)'
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name='Активна',
        help_text='Отображается ли категория на сайте'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        verbose_name = 'Категория форума'
        verbose_name_plural = 'Категории форума'
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class ForumTopic(models.Model):
    """
    Темы обсуждений в форуме
    """
    category = models.ForeignKey(
        ForumCategory,
        on_delete=models.CASCADE,
        related_name='topics',
        verbose_name='Категория',
        help_text='Категория, к которой относится тема'
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='forum_topics',
        verbose_name='Автор',
        help_text='Пользователь, создавший тему'
    )
    title = models.CharField(
        max_length=200,
        verbose_name='Заголовок',
        validators=[MinLengthValidator(5)],
        help_text='Заголовок темы (минимум 5 символов)'
    )
    content = models.TextField(
        verbose_name='Содержание',
        validators=[MinLengthValidator(10)],
        help_text='Текст темы (минимум 10 символов)'
    )
    is_pinned = models.BooleanField(
        default=False,
        verbose_name='Закреплена',
        help_text='Закреплена ли тема в верхней части списка'
    )
    is_locked = models.BooleanField(
        default=False,
        verbose_name='Закрыта',
        help_text='Закрыта ли тема для новых сообщений'
    )
    views_count = models.IntegerField(
        default=0,
        verbose_name='Количество просмотров',
        help_text='Сколько раз тему просмотрели'
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
        verbose_name = 'Тема форума'
        verbose_name_plural = 'Темы форума'
        ordering = ['-is_pinned', '-created_at']
        indexes = [
            models.Index(fields=['category', '-created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.category.name})"
    
    def get_posts_count(self):
        # Считает сколько сообщений в теме
        return self.posts.count()
    
    def get_last_post(self):
        # Возвращает последнее сообщение в теме
        return self.posts.order_by('-created_at').first()


class ForumPost(models.Model):
    """
    Сообщения в темах форума
    """
    topic = models.ForeignKey(
        ForumTopic,
        on_delete=models.CASCADE,
        related_name='posts',
        verbose_name='Тема',
        help_text='Тема, к которой относится сообщение'
    )
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='forum_posts',
        verbose_name='Автор',
        help_text='Пользователь, написавший сообщение'
    )
    content = models.TextField(
        verbose_name='Содержание',
        validators=[MinLengthValidator(1)],
        help_text='Текст сообщения'
    )
    is_edited = models.BooleanField(
        default=False,
        verbose_name='Отредактировано',
        help_text='Было ли сообщение отредактировано'
    )
    edited_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Дата редактирования'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        verbose_name = 'Сообщение форума'
        verbose_name_plural = 'Сообщения форума'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['topic', 'created_at']),
            models.Index(fields=['author', '-created_at']),
        ]
    
    def __str__(self):
        return f"Сообщение от {self.author.username} в теме {self.topic.title}"
    
    def save(self, *args, **kwargs):
        # Автоматически отмечает сообщение как отредактированное если изменился текст
        if self.pk:
            # Если объект уже существует, проверяем, изменилось ли содержание
            old_instance = ForumPost.objects.get(pk=self.pk)
            if old_instance.content != self.content:
                self.is_edited = True
        super().save(*args, **kwargs)


class ForumLike(models.Model):
    """
    Лайки к сообщениям форума
    """
    post = models.ForeignKey(
        ForumPost,
        on_delete=models.CASCADE,
        related_name='likes',
        verbose_name='Сообщение',
        help_text='Сообщение, которому поставили лайк'
    )
    user = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='forum_likes',
        verbose_name='Пользователь',
        help_text='Пользователь, поставивший лайк'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата создания'
    )
    
    class Meta:
        verbose_name = 'Лайк'
        verbose_name_plural = 'Лайки'
        unique_together = ['post', 'user']  # Один пользователь может поставить только один лайк на сообщение
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Лайк от {self.user.username} к сообщению {self.post.id}"


class ForumImage(models.Model):
    """
    Изображения в темах и постах форума
    """
    topic = models.ForeignKey(
        ForumTopic,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Тема',
        help_text='Тема, к которой относится изображение',
        null=True,
        blank=True
    )
    post = models.ForeignKey(
        ForumPost,
        on_delete=models.CASCADE,
        related_name='images',
        verbose_name='Сообщение',
        help_text='Сообщение, к которому относится изображение',
        null=True,
        blank=True
    )
    image = models.ImageField(
        upload_to='forum/images/%Y/%m/%d/',
        verbose_name='Изображение',
        help_text='Загруженное изображение'
    )
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.CASCADE,
        related_name='forum_images',
        verbose_name='Загружено пользователем',
        help_text='Пользователь, загрузивший изображение'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Дата загрузки'
    )
    
    class Meta:
        verbose_name = 'Изображение форума'
        verbose_name_plural = 'Изображения форума'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['topic', '-created_at']),
            models.Index(fields=['post', '-created_at']),
        ]
    
    def save(self, *args, **kwargs):
        """
        Обрабатывает изображение перед сохранением: обрезает до формата 4:3
        """
        if self.image and not self.pk:  # Только при создании нового изображения
            self.image = self._process_image(self.image)
        super().save(*args, **kwargs)
    
    def _process_image(self, image):
        """
        Обрабатывает изображение: обрезает до прямоугольного формата (4:3)
        Аналогично обработке изображений автомобилей
        """
        from PIL import Image
        from io import BytesIO
        from django.core.files.base import ContentFile
        import os
        
        # Открываем изображение
        if hasattr(image, 'file'):
            if hasattr(image.file, 'seek'):
                current_pos = image.file.tell()
                image.file.seek(0)
            img = Image.open(image.file)
            if hasattr(image.file, 'seek'):
                image.file.seek(0)
        elif hasattr(image, 'read'):
            current_pos = image.tell()
            image.seek(0)
            img = Image.open(image)
            image.seek(current_pos)
        else:
            img = Image.open(image)
        
        # Конвертируем в RGB, если нужно
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        width, height = img.size
        
        # Целевое соотношение сторон (4:3)
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
        filename = os.path.basename(image.name) if hasattr(image, 'name') and image.name else 'forum_image.jpg'
        name, ext = os.path.splitext(filename)
        new_filename = f"{name}_processed.jpg"
        
        # Создаем новый файл с обработанным изображением
        image_file = ContentFile(buffer.read(), name=new_filename)
        buffer.close()
        
        # Заменяем содержимое исходного файла
        if hasattr(image, 'file'):
            image.file = image_file
            image.name = new_filename
        else:
            image = image_file
        
        return image
    
    def __str__(self):
        if self.topic:
            return f"Изображение в теме {self.topic.title}"
        elif self.post:
            return f"Изображение в сообщении {self.post.id}"
        return f"Изображение {self.id}"


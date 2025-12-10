from rest_framework import serializers
from .models import Event, EventRegistration


class EventSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    participants_count = serializers.IntegerField(read_only=True)
    likes_count = serializers.SerializerMethodField()
    is_registration_open = serializers.BooleanField(read_only=True)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'location',
            'event_date', 'registration_deadline', 'max_participants',
            'image', 'image_url', 'is_active', 'created_by', 'participants_count',
            'likes_count', 'is_registration_open', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'participants_count', 'likes_count', 'is_registration_open', 'created_at', 'updated_at', 'image_url']
    
    def get_image_url(self, obj):
        """
        Возвращает относительный URL изображения мероприятия для использования через прокси Vite
        Django obj.image.url возвращает путь относительно MEDIA_URL
        """
        if obj.image:
            try:
                # Получаем URL от Django
                # obj.image.url возвращает путь вида "/media/events/2025/12/05/image.jpg"
                # или "events/2025/12/05/image.jpg" в зависимости от настроек
                image_url = obj.image.url
                
                # Если это уже полный URL (http/https), возвращаем как есть
                if image_url.startswith('http://') or image_url.startswith('https://'):
                    return image_url
                
                # Если URL уже начинается с /media/, возвращаем как есть
                if image_url.startswith('/media/'):
                    return image_url
                
                # Если URL начинается с /, но не с /media/, добавляем /media/
                if image_url.startswith('/'):
                    # Убираем начальный слэш и добавляем /media/
                    return f'/media{image_url}'
                
                # Если URL не начинается с /, добавляем /media/
                # Django может возвращать путь вида "events/2025/12/05/image.jpg"
                return f'/media/{image_url}'
            except Exception as e:
                # Логируем ошибку для отладки
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Ошибка получения URL изображения: {e}')
                return None
        return None
    
    def get_likes_count(self, obj):
        """
        Возвращает количество лайков мероприятия
        """
        return obj.registrations.filter(is_attending=True).count()


class CreateEventSerializer(serializers.ModelSerializer):
    """
    Сериализатор для создания мероприятия
    """
    class Meta:
        model = Event
        fields = [
            'title', 'description', 'event_type', 'location',
            'event_date', 'registration_deadline', 'max_participants',
            'image', 'is_active'
        ]


class EventRegistrationSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    user_id = serializers.SerializerMethodField()
    user_avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'user', 'user_id', 'user_avatar', 'is_anonymous', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'user_id', 'user_avatar', 'created_at']
    
    def get_user(self, obj):
        """
        Возвращает имя пользователя или "Аноним" если is_anonymous=True
        """
        if obj.is_anonymous:
            return "Аноним"
        return obj.user.username
    
    def get_user_id(self, obj):
        """
        Возвращает ID пользователя для создания ссылки на профиль
        """
        if obj.is_anonymous:
            return None
        return obj.user.id
    
    def get_user_avatar(self, obj):
        """
        Возвращает аватар пользователя или None для анонимных
        """
        if obj.is_anonymous:
            return None
        if obj.user.avatar:
            request = self.context.get('request')
            if request:
                # Возвращаем относительный путь для прокси Vite
                avatar_url = obj.user.avatar.url
                if avatar_url.startswith('/media/'):
                    return avatar_url
                elif avatar_url.startswith('/'):
                    return f'/media{avatar_url}'
                else:
                    return f'/media/{avatar_url}'
            return obj.user.avatar.url
        return None


from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Car, CarPhoto


# Сериализатор для фото машины
class CarPhotoSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = CarPhoto
        fields = ['id', 'photo', 'photo_url', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at', 'photo_url']
    
    def get_photo_url(self, obj):
        # Возвращает полную ссылку на фото
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


# Сериализатор для машины
class CarSerializer(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    photos = CarPhotoSerializer(many=True, read_only=True)
    primary_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Car
        fields = ['id', 'brand', 'model', 'generation', 'year', 'license_plate', 'vin', 'color', 'photo', 'photo_url', 'primary_photo_url', 'photos', 'created_at']
        read_only_fields = ['id', 'created_at', 'photo_url', 'primary_photo_url', 'photos']
    
    def get_photo_url(self, obj):
        # Возвращает ссылку на основное фото - для обратной совместимости
        # Сначала ищем основное фото из CarPhoto
        primary_photo = obj.photos.filter(is_primary=True).first()
        if primary_photo and primary_photo.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_photo.photo.url)
            return primary_photo.photo.url
        
        # Если нет основного фото, используем старое поле photo
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_primary_photo_url(self, obj):
        # Возвращает ссылку на основное фото
        primary_photo = obj.photos.filter(is_primary=True).first()
        if primary_photo and primary_photo.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(primary_photo.photo.url)
            return primary_photo.photo.url
        
        # Если нет основного фото, используем старое поле photo
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class UserSerializer(serializers.ModelSerializer):
    cars = CarSerializer(many=True, read_only=True)
    avatar_url = serializers.SerializerMethodField()
    instagram_url = serializers.SerializerMethodField()
    instagram_username = serializers.SerializerMethodField()
    telegram_url = serializers.SerializerMethodField()
    telegram_username = serializers.SerializerMethodField()
    youtube_url = serializers.SerializerMethodField()
    youtube_username = serializers.SerializerMethodField()
    vk_url = serializers.SerializerMethodField()
    vk_username = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'avatar', 'avatar_url', 'is_phone_private', 
            'is_name_private', 'is_first_name_private', 'is_last_name_private',
            'is_email_private', 'is_staff', 'is_superuser',
            'bio', 'instagram', 'telegram', 'youtube', 'vk',
            'instagram_url', 'instagram_username',
            'telegram_url', 'telegram_username',
            'youtube_url', 'youtube_username',
            'vk_url', 'vk_username',
            'cars', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'avatar_url', 'is_staff', 'is_superuser',
                           'instagram_url', 'instagram_username',
                           'telegram_url', 'telegram_username',
                           'youtube_url', 'youtube_username',
                           'vk_url', 'vk_username']
    
    def get_avatar_url(self, obj):
        # Возвращает полную ссылку на аватар
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
    
    def get_instagram_url(self, obj):
        return obj.get_instagram_url()
    
    def get_instagram_username(self, obj):
        return obj.get_instagram_username()
    
    def get_telegram_url(self, obj):
        return obj.get_telegram_url()
    
    def get_telegram_username(self, obj):
        return obj.get_telegram_username()
    
    def get_youtube_url(self, obj):
        return obj.get_youtube_url()
    
    def get_youtube_username(self, obj):
        return obj.get_youtube_username()
    
    def get_vk_url(self, obj):
        return obj.get_vk_url()
    
    def get_vk_username(self, obj):
        return obj.get_vk_username()
    
    def _is_own_profile(self, obj):
        # Проверяет, является ли текущий пользователь владельцем профиля
        request = self.context.get('request')
        if not request:
            # Если нет запроса в контексте, считаем что это не свой профиль
            return False
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return False
        return request.user.id == obj.id
    
    def to_representation(self, instance):
        # Переопределяем метод для скрытия данных по настройкам приватности
        data = super().to_representation(instance)
        
        # Проверяем, является ли это запросом собственного профиля
        is_own = self._is_own_profile(instance)
        
        # Если нет запроса в контексте, скрываем приватные данные по умолчанию
        request = self.context.get('request')
        if not request:
            # Без запроса не можем определить владельца, скрываем приватные данные
            if instance.is_email_private:
                data['email'] = None
            if instance.is_name_private:
                data['first_name'] = None
                data['last_name'] = None
            elif instance.is_first_name_private:
                data['first_name'] = None
            elif instance.is_last_name_private:
                data['last_name'] = None
            if instance.is_phone_private:
                data['phone'] = None
            return data
        
        # Скрываем email, если включена приватность и это не свой профиль
        if instance.is_email_private and not is_own:
            data['email'] = None
        
        # Скрываем имя и фамилию по настройкам приватности
        if instance.is_name_private and not is_own:
            # Если включено общее скрытие имени и фамилии, скрываем оба
            data['first_name'] = None
            data['last_name'] = None
        else:
            # Иначе скрываем отдельно имя или фамилию
            if instance.is_first_name_private and not is_own:
                data['first_name'] = None
            if instance.is_last_name_private and not is_own:
                data['last_name'] = None
        
        # Скрываем телефон, если включена приватность и это не свой профиль
        if instance.is_phone_private and not is_own:
            data['phone'] = None
        
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Пароли не совпадают")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Неверные учетные данные')
            if not user.is_active:
                raise serializers.ValidationError('Учетная запись отключена')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Необходимо указать username и password')
        return attrs


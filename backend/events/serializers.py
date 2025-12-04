from rest_framework import serializers
from .models import Event, EventRegistration
from accounts.serializers import CarSerializer


class EventSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    participants_count = serializers.IntegerField(read_only=True)
    is_registration_open = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'event_type', 'location',
            'event_date', 'registration_deadline', 'max_participants',
            'image', 'is_active', 'created_by', 'participants_count',
            'is_registration_open', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'participants_count', 'is_registration_open', 'created_at', 'updated_at']


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
    event = EventSerializer(read_only=True)
    user = serializers.SerializerMethodField()
    car = CarSerializer(read_only=True)
    car_id = serializers.IntegerField(
        source='car',
        write_only=True,
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = EventRegistration
        fields = [
            'id', 'event', 'user', 'is_attending', 'is_anonymous',
            'car', 'car_id', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'event', 'user', 'created_at', 'updated_at']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Устанавливаем queryset для car_id только если есть request
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from accounts.models import Car
            self.fields['car_id'].queryset = Car.objects.filter(user=request.user)
    
    def get_user(self, obj):
        """
        Возвращает имя пользователя или "Аноним" если is_anonymous=True
        Всегда показываем, что пользователь зарегистрирован, но имя скрыто
        """
        if obj.is_anonymous:
            return "Аноним"
        return obj.user.username


class RegisterEventSerializer(serializers.Serializer):
    """
    Сериализатор для регистрации на мероприятие
    """
    is_attending = serializers.BooleanField(default=True)
    is_anonymous = serializers.BooleanField(default=False)
    car_id = serializers.IntegerField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_car_id(self, value):
        """
        Проверяем, что автомобиль принадлежит пользователю
        """
        if value is not None:
            request = self.context.get('request')
            if request and request.user.is_authenticated:
                from accounts.models import Car
                try:
                    car = Car.objects.get(id=value, user=request.user)
                except Car.DoesNotExist:
                    raise serializers.ValidationError("Автомобиль не найден или не принадлежит вам")
        return value


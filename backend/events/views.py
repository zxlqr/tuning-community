from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Event, EventRegistration
from .serializers import (
    EventSerializer, EventRegistrationSerializer,
    CreateEventSerializer, RegisterEventSerializer
)


class EventViewSet(viewsets.ModelViewSet):
    """
    ViewSet для мероприятий
    """
    serializer_class = EventSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['event_type', 'is_active']
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['event_date', 'created_at']
    
    def get_queryset(self):
        queryset = Event.objects.filter(is_active=True)
        # Показываем прошедшие мероприятия только если явно запрошено
        show_past = self.request.query_params.get('show_past', 'false').lower() == 'true'
        if not show_past:
            queryset = queryset.filter(event_date__gte=timezone.now())
        return queryset.select_related('created_by').prefetch_related('registrations')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateEventSerializer
        return EventSerializer
    
    def get_permissions(self):
        """
        Разрешаем создание/редактирование только авторизованным пользователям
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request, pk=None):
        """
        Регистрация на мероприятие
        """
        event = self.get_object()
        
        # Проверяем, открыта ли регистрация
        if not event.is_registration_open:
            return Response(
                {'error': 'Регистрация на это мероприятие закрыта'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем лимит участников
        if event.max_participants and event.participants_count >= event.max_participants:
            return Response(
                {'error': 'Достигнут лимит участников'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверяем, не зарегистрирован ли уже пользователь
        if EventRegistration.objects.filter(event=event, user=request.user).exists():
            return Response(
                {'error': 'Вы уже зарегистрированы на это мероприятие'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = RegisterEventSerializer(data=request.data)
        if serializer.is_valid():
            registration = EventRegistration.objects.create(
                event=event,
                user=request.user,
                is_attending=serializer.validated_data.get('is_attending', True),
                is_anonymous=serializer.validated_data.get('is_anonymous', False),
                car_id=serializer.validated_data.get('car_id'),
                notes=serializer.validated_data.get('notes', '')
            )
            return Response(
                EventRegistrationSerializer(registration).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def participants(self, request, pk=None):
        """
        Получить список участников мероприятия
        Анонимные регистрации показываются как "Аноним" для всех
        """
        event = self.get_object()
        registrations = event.registrations.filter(is_attending=True)
        
        # Показываем все регистрации, включая анонимные
        # В сериализаторе анонимные будут отображаться как "Аноним"
        serializer = EventRegistrationSerializer(registrations, many=True, context={'request': request})
        return Response(serializer.data)


class EventRegistrationViewSet(viewsets.ModelViewSet):
    """
    ViewSet для регистраций на мероприятия
    """
    serializer_class = EventRegistrationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return EventRegistration.objects.all()
        else:
            return EventRegistration.objects.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

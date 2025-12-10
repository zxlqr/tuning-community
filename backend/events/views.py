from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Event, EventRegistration
from .serializers import (
    EventSerializer, EventRegistrationSerializer,
    CreateEventSerializer
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
        now = timezone.now()
        if show_past:
            # Показываем только прошедшие мероприятия
            queryset = queryset.filter(event_date__lt=now)
        else:
            # Показываем только предстоящие мероприятия
            queryset = queryset.filter(event_date__gte=now)
        return queryset.select_related('created_by').prefetch_related('registrations')
    
    def get_serializer_context(self):
        """
        Передаем request в контекст сериализатора для построения полных URL
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
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
    
    @action(detail=True, methods=['post', 'delete'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Поставить/убрать лайк на мероприятие
        POST - поставить лайк, DELETE - убрать лайк
        """
        event = self.get_object()
        user = request.user
        
        # Проверяем, есть ли уже лайк от этого пользователя
        existing_like = EventRegistration.objects.filter(event=event, user=user).first()
        
        if request.method == 'DELETE':
            # Убираем лайк
            if existing_like:
                existing_like.delete()
                return Response(
                    {'message': 'Лайк убран', 'is_liked': False},
                    status=status.HTTP_200_OK
                )
            return Response(
                {'error': 'Лайк не найден'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # POST - ставим лайк
        is_anonymous = request.data.get('is_anonymous', False)
        
        if existing_like:
            # Обновляем существующий лайк (например, меняем анонимность)
            existing_like.is_anonymous = is_anonymous
            existing_like.save()
            return Response(
                EventRegistrationSerializer(existing_like, context={'request': request}).data,
                status=status.HTTP_200_OK
            )
        
        # Создаем новый лайк
        like = EventRegistration.objects.create(
            event=event,
            user=user,
            is_attending=True,  # Всегда True для лайков
            is_anonymous=is_anonymous
        )
        return Response(
            EventRegistrationSerializer(like, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['get'])
    def likes(self, request, pk=None):
        """
        Получить список лайков мероприятия
        Анонимные лайки показываются как "Аноним"
        """
        event = self.get_object()
        likes = event.registrations.filter(is_attending=True).order_by('-created_at')
        
        serializer = EventRegistrationSerializer(likes, many=True, context={'request': request})
        return Response({
            'count': likes.count(),
            'results': serializer.data
        })
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def is_liked(self, request, pk=None):
        """
        Проверить, поставил ли текущий пользователь лайк
        """
        event = self.get_object()
        is_liked = EventRegistration.objects.filter(event=event, user=request.user).exists()
        like = EventRegistration.objects.filter(event=event, user=request.user).first()
        
        return Response({
            'is_liked': is_liked,
            'is_anonymous': like.is_anonymous if like else False
        })


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

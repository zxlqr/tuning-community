from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from .models import ForumCategory, ForumTopic, ForumPost, ForumLike, ForumImage
from .serializers import (
    ForumCategorySerializer, ForumTopicListSerializer, ForumTopicDetailSerializer,
    ForumPostSerializer, ForumLikeSerializer, ForumImageSerializer
)


class ForumCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для категорий форума (только чтение для всех пользователей)
    """
    queryset = ForumCategory.objects.filter(is_active=True).annotate(
        topics_count=Count('topics')
    )
    serializer_class = ForumCategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']


class ForumTopicViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления темами форума
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'author', 'is_pinned', 'is_locked']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'updated_at', 'views_count']
    ordering = ['-is_pinned', '-created_at']
    
    def get_queryset(self):
        """
        Возвращает список тем с дополнительной информацией
        """
        queryset = ForumTopic.objects.select_related(
            'category', 'author'
        ).prefetch_related('posts', 'images').annotate(
            posts_count=Count('posts')
        )
        
        # Фильтрация по категории, если указана
        category_slug = self.request.query_params.get('category_slug', None)
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        
        return queryset
    
    def get_serializer_class(self):
        """
        Используем разные сериализаторы для списка и детального просмотра
        """
        if self.action == 'retrieve':
            return ForumTopicDetailSerializer
        elif self.action == 'create':
            # Для создания используем детальный сериализатор, так как он содержит content
            return ForumTopicDetailSerializer
        return ForumTopicListSerializer
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст сериализатора для полных ссылок
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """
        При создании темы автоматически устанавливаем автора
        """
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        """
        При обновлении темы проверяем, что пользователь является автором
        """
        topic = self.get_object()
        if topic.author != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            raise serializers.ValidationError('Вы можете редактировать только свои темы')
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        При удалении темы проверяем права
        """
        if instance.author != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Вы можете удалять только свои темы')
        instance.delete()
    
    def retrieve(self, request, *args, **kwargs):
        """
        При просмотре темы увеличиваем счетчик просмотров
        """
        instance = self.get_object()
        instance.views_count += 1
        instance.save(update_fields=['views_count'])
        response = super().retrieve(request, *args, **kwargs)
        # Для отладки - логируем данные ответа
        if hasattr(response, 'data') and 'images' in response.data:
            print(f"DEBUG: Изображения темы {instance.id}: {response.data['images']}")
        return response
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_pin(self, request, pk=None):
        """
        Закрепить/открепить тему (только для менеджеров и админов)
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Недостаточно прав'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        topic = self.get_object()
        topic.is_pinned = not topic.is_pinned
        topic.save()
        return Response({'is_pinned': topic.is_pinned})
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_lock(self, request, pk=None):
        """
        Закрыть/открыть тему (только для менеджеров и админов)
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {'error': 'Недостаточно прав'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        topic = self.get_object()
        topic.is_locked = not topic.is_locked
        topic.save()
        return Response({'is_locked': topic.is_locked})


class ForumPostViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления сообщениями в темах
    """
    serializer_class = ForumPostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['topic', 'author']
    ordering_fields = ['created_at']
    ordering = ['created_at']
    
    def get_queryset(self):
        """
        Возвращает сообщения с информацией о лайках и изображениях
        """
        return ForumPost.objects.select_related(
            'topic', 'author'
        ).prefetch_related('likes', 'likes__user', 'images').annotate(
            likes_count=Count('likes')
        )
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст сериализатора для проверки лайков
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """
        При создании сообщения проверяем, не закрыта ли тема
        """
        topic = serializer.validated_data['topic']
        if topic.is_locked:
            raise serializers.ValidationError('Тема закрыта для новых сообщений')
        serializer.save(author=self.request.user)
    
    def perform_update(self, serializer):
        """
        При обновлении сообщения проверяем, что пользователь является автором
        """
        post = self.get_object()
        if post.author != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            raise serializers.ValidationError('Вы можете редактировать только свои сообщения')
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        При удалении сообщения проверяем права
        """
        if instance.author != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Вы можете удалять только свои сообщения')
        instance.delete()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """
        Поставить/убрать лайк к сообщению
        """
        post = self.get_object()
        like, created = ForumLike.objects.get_or_create(
            post=post,
            user=request.user
        )
        
        if not created:
            # Если лайк уже существует, удаляем его
            like.delete()
            return Response({'liked': False, 'message': 'Лайк убран'})
        
        return Response({'liked': True, 'message': 'Лайк поставлен'})
    
    @action(detail=True, methods=['get'])
    def likes(self, request, pk=None):
        """
        Получить список пользователей, поставивших лайк
        """
        post = self.get_object()
        likes = post.likes.select_related('user')
        serializer = ForumLikeSerializer(likes, many=True)
        return Response(serializer.data)


class ForumImageViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления изображениями форума
    """
    serializer_class = ForumImageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['topic', 'post', 'uploaded_by']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Возвращает изображения форума
        """
        return ForumImage.objects.select_related('topic', 'post', 'uploaded_by')
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст сериализатора для полных ссылок
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """
        При создании изображения автоматически устанавливаем загрузившего пользователя
        """
        # Логируем данные для отладки
        print(f"DEBUG: Создание изображения форума")
        print(f"DEBUG: Данные запроса: {self.request.data}")
        print(f"DEBUG: Валидированные данные: {serializer.validated_data}")
        
        instance = serializer.save(uploaded_by=self.request.user)
        
        # Проверяем, что изображение связано с темой или постом
        print(f"DEBUG: Изображение создано, ID: {instance.id}")
        print(f"DEBUG: Связано с темой: {instance.topic_id if instance.topic else None}")
        print(f"DEBUG: Связано с постом: {instance.post_id if instance.post else None}")
        
        return instance
    
    def perform_destroy(self, instance):
        """
        При удалении изображения проверяем права
        """
        if instance.uploaded_by != self.request.user and not (self.request.user.is_staff or self.request.user.is_superuser):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Вы можете удалять только свои изображения')
        instance.delete()


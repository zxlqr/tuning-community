# API для входа, регистрации и управления машинами
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import login, logout
from .models import User, Car, CarPhoto
from .serializers import (
    UserSerializer, UserRegistrationSerializer, LoginSerializer, CarSerializer, CarPhotoSerializer
)


# API для входа и регистрации - использует сессии Django
class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        # Регистрация нового пользователя - сразу входит в систему
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            login(request, user)  # Автоматический вход после регистрации
            # Передаем контекст запроса, чтобы пользователь видел свои данные
            return Response(UserSerializer(user, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        # Вход в систему - проверяет логин/пароль и создает сессию
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request, user)  # Создание сессии
            # Передаем контекст запроса, чтобы пользователь видел свои данные
            return Response(UserSerializer(user, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def logout(self, request):
        # Выход из системы - удаляет сессию
        logout(request)
        return Response({'message': 'Вы вышли из системы'})
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        # Возвращает данные текущего пользователя и его машины
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch', 'put'], permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        # Обновление профиля пользователя (включая аватар)
        user = request.user
        serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# API для просмотра профилей пользователей
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра профилей пользователей
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]  # Разрешаем просмотр профилей всем
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст для правильной обработки приватных полей
        """
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


# API для управления машинами - каждый видит только свои
class CarViewSet(viewsets.ModelViewSet):
    serializer_class = CarSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Возвращает только машины текущего пользователя
        return Car.objects.filter(user=self.request.user).select_related('user').prefetch_related('photos')
    
    def get_serializer_context(self):
        # Добавляет request в контекст для полных ссылок на фото
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """
        При создании автомобиля автоматически устанавливается владелец (текущий пользователь).
        """
        try:
            serializer.save(user=self.request.user)
        except Exception as e:
            # Логируем ошибку для отладки
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f'Ошибка при создании автомобиля: {e}')
            logger.error(traceback.format_exc())
            # Пробрасываем ошибку дальше, чтобы она была обработана DRF
            raise


class CarPhotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления фото автомобилей.
    
    Позволяет добавлять, просматривать и удалять фото автомобилей.
    """
    serializer_class = CarPhotoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Возвращает только фото машин текущего пользователя, можно фильтровать по car_id
        queryset = CarPhoto.objects.filter(car__user=self.request.user).select_related('car')
        car_id = self.request.query_params.get('car_id')
        if car_id:
            queryset = queryset.filter(car_id=car_id)
        return queryset
    
    def get_serializer_context(self):
        # Добавляет request в контекст для полных ссылок на фото
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """
        При создании фото проверяем, что автомобиль принадлежит текущему пользователю.
        """
        car_id = self.request.data.get('car')
        if car_id:
            try:
                car = Car.objects.get(pk=car_id, user=self.request.user)
                serializer.save(car=car)
            except Car.DoesNotExist:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Автомобиль не найден или не принадлежит вам")
        else:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Не указан автомобиль")


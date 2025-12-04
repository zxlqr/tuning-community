from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ForumCategoryViewSet, ForumTopicViewSet, ForumPostViewSet, ForumImageViewSet

# Создаем роутер для автоматической генерации URL-ов
router = DefaultRouter()
router.register(r'categories', ForumCategoryViewSet, basename='forum-category')
router.register(r'topics', ForumTopicViewSet, basename='forum-topic')
router.register(r'posts', ForumPostViewSet, basename='forum-post')
router.register(r'images', ForumImageViewSet, basename='forum-image')

urlpatterns = [
    path('', include(router.urls)),
]


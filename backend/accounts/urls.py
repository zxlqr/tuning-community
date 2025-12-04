from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet, CarViewSet, CarPhotoViewSet, UserViewSet

router = DefaultRouter()
# Не добавляем 'auth' здесь, так как он уже есть в главном urls.py (api/auth/)
router.register(r'', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'cars', CarViewSet, basename='car')
router.register(r'car-photos', CarPhotoViewSet, basename='car-photo')

urlpatterns = [
    path('', include(router.urls)),
]


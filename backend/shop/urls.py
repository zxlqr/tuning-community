from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductCategoryViewSet, ProductViewSet, OrderViewSet, ShopViewSet

router = DefaultRouter()
router.register(r'categories', ProductCategoryViewSet, basename='product-category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'shops', ShopViewSet, basename='shop')

urlpatterns = [
    path('', include(router.urls)),
]


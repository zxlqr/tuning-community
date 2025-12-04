from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BonusTransactionViewSet, PromoCodeViewSet, SettingsViewSet

router = DefaultRouter()
router.register(r'bonus/transactions', BonusTransactionViewSet, basename='bonus-transaction')
router.register(r'promo-codes', PromoCodeViewSet, basename='promo-code')
router.register(r'settings', SettingsViewSet, basename='settings')

urlpatterns = [
    path('', include(router.urls)),
]


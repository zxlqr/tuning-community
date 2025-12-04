from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import BonusTransaction, PromoCode, Settings
from .serializers import (
    BonusTransactionSerializer, PromoCodeSerializer,
    PromoCodeValidateSerializer, SettingsSerializer
)


class BonusTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для просмотра транзакций бонусов
    """
    serializer_class = BonusTransactionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BonusTransaction.objects.filter(user=self.request.user)  # booking removed
    
    @action(detail=False, methods=['get'])
    def balance(self, request):
        # Система бонусных баллов удалена
        return Response({
            'balance': 0,
            'user': request.user.username,
            'message': 'Система бонусных баллов отключена'
        })


class PromoCodeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для промокодов
    """
    serializer_class = PromoCodeSerializer
    permission_classes = [AllowAny]
    queryset = PromoCode.objects.filter(is_active=True)
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """
        Проверить валидность промокода и рассчитать скидку
        """
        serializer = PromoCodeValidateSerializer(data=request.data)
        if serializer.is_valid():
            promo_code = serializer.validated_data['promo_code']
            order_amount = serializer.validated_data['order_amount']
            
            discounted_amount = promo_code.apply_discount(order_amount)
            discount = order_amount - discounted_amount
            
            return Response({
                'valid': True,
                'promo_code': PromoCodeSerializer(promo_code).data,
                'original_amount': order_amount,
                'discounted_amount': discounted_amount,
                'discount': discount
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SettingsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для настроек системы (только чтение)
    """
    serializer_class = SettingsSerializer
    permission_classes = [AllowAny]
    queryset = Settings.objects.all()
    
    def get_queryset(self):
        # Возвращаем singleton
        return Settings.objects.filter(pk=1) if Settings.objects.exists() else Settings.objects.none()


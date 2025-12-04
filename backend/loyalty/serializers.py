from rest_framework import serializers
from .models import BonusTransaction, PromoCode, Settings
from bookings.serializers import BookingSerializer


class BonusTransactionSerializer(serializers.ModelSerializer):
    booking = BookingSerializer(read_only=True)
    
    class Meta:
        model = BonusTransaction
        fields = [
            'id', 'user', 'booking', 'points', 'transaction_type',
            'description', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']


class PromoCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = [
            'id', 'code', 'discount_percent', 'discount_amount',
            'min_order_amount', 'max_uses', 'used_count',
            'valid_from', 'valid_until', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'used_count', 'created_at']


class PromoCodeValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    order_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    
    def validate(self, attrs):
        code = attrs.get('code')
        order_amount = attrs.get('order_amount')
        
        try:
            promo_code = PromoCode.objects.get(code=code)
        except PromoCode.DoesNotExist:
            raise serializers.ValidationError('Промокод не найден')
        
        if not promo_code.is_valid():
            raise serializers.ValidationError('Промокод недействителен')
        
        if order_amount < promo_code.min_order_amount:
            raise serializers.ValidationError(
                f'Минимальная сумма заказа для этого промокода: {promo_code.min_order_amount} руб.'
            )
        
        attrs['promo_code'] = promo_code
        return attrs


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Settings
        fields = [
            'bonus_points_per_rub', 'bonus_points_to_rub',
            'booking_advance_days', 'working_hours_start',
            'working_hours_end'
        ]


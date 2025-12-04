from django.contrib import admin
from .models import BonusTransaction, PromoCode, Settings


@admin.register(BonusTransaction)
class BonusTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'points', 'transaction_type', 'booking', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__username', 'description']
    date_hierarchy = 'created_at'
    readonly_fields = ['created_at']


@admin.register(PromoCode)
class PromoCodeAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'discount_percent', 'discount_amount',
        'min_order_amount', 'used_count', 'max_uses',
        'valid_from', 'valid_until', 'is_active'
    ]
    list_filter = ['is_active', 'valid_from', 'valid_until']
    search_fields = ['code']
    readonly_fields = ['used_count', 'created_at']


@admin.register(Settings)
class SettingsAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return not Settings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False


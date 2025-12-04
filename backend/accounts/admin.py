from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Car, CarPhoto, Badge, UserBadge


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'phone', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_phone_private', 'is_name_private', 'is_email_private']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Дополнительная информация', {
            'fields': ('phone', 'avatar')
        }),
        ('Настройки приватности', {
            'fields': ('is_phone_private', 'is_name_private', 'is_email_private')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Дополнительная информация', {
            'fields': ('phone',)
        }),
    )


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ['brand', 'model', 'generation', 'year', 'user', 'created_at']
    list_filter = ['brand', 'year', 'created_at']
    search_fields = ['brand', 'model', 'generation', 'license_plate', 'vin', 'user__username']
    readonly_fields = ['created_at']


@admin.register(CarPhoto)
class CarPhotoAdmin(admin.ModelAdmin):
    list_display = ['car', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['car__brand', 'car__model']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['name', 'event_name', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'event_name', 'description']


@admin.register(UserBadge)
class UserBadgeAdmin(admin.ModelAdmin):
    list_display = ['user', 'badge', 'earned_at']
    list_filter = ['badge', 'earned_at']
    search_fields = ['user__username', 'badge__name']
    readonly_fields = ['earned_at']

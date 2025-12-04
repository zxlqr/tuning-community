from django.contrib import admin
from .models import Event, EventRegistration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'location', 'event_date', 'is_active', 'created_by']
    list_filter = ['event_type', 'is_active', 'event_date']
    search_fields = ['title', 'description', 'location']
    readonly_fields = ['created_at', 'updated_at', 'participants_count']


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['event', 'user', 'is_attending', 'is_anonymous', 'created_at']
    list_filter = ['is_attending', 'is_anonymous', 'created_at']
    search_fields = ['user__username', 'event__title']
    readonly_fields = ['created_at', 'updated_at']

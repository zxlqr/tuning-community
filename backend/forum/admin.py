from django.contrib import admin
from .models import ForumCategory, ForumTopic, ForumPost, ForumLike, ForumImage


@admin.register(ForumCategory)
class ForumCategoryAdmin(admin.ModelAdmin):
    """
    Админ-панель для управления категориями форума
    """
    list_display = ['name', 'slug', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}  # Автоматическое заполнение slug из названия
    ordering = ['order', 'name']


@admin.register(ForumTopic)
class ForumTopicAdmin(admin.ModelAdmin):
    """
    Админ-панель для управления темами форума
    """
    list_display = ['title', 'category', 'author', 'is_pinned', 'is_locked', 'views_count', 'created_at']
    list_filter = ['category', 'is_pinned', 'is_locked', 'created_at']
    search_fields = ['title', 'content', 'author__username']
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    raw_id_fields = ['author']  # Для удобного выбора пользователя


@admin.register(ForumPost)
class ForumPostAdmin(admin.ModelAdmin):
    """
    Админ-панель для управления сообщениями форума
    """
    list_display = ['topic', 'author', 'is_edited', 'created_at']
    list_filter = ['is_edited', 'created_at', 'topic__category']
    search_fields = ['content', 'author__username', 'topic__title']
    readonly_fields = ['is_edited', 'edited_at', 'created_at']
    date_hierarchy = 'created_at'
    raw_id_fields = ['topic', 'author']


@admin.register(ForumLike)
class ForumLikeAdmin(admin.ModelAdmin):
    """
    Админ-панель для управления лайками
    """
    list_display = ['post', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__content']
    readonly_fields = ['created_at']
    raw_id_fields = ['post', 'user']


@admin.register(ForumImage)
class ForumImageAdmin(admin.ModelAdmin):
    """
    Админ-панель для управления изображениями форума
    """
    list_display = ['id', 'topic', 'post', 'uploaded_by', 'created_at']
    list_filter = ['created_at', 'topic__category']
    search_fields = ['uploaded_by__username', 'topic__title', 'post__content']
    readonly_fields = ['created_at']
    raw_id_fields = ['topic', 'post', 'uploaded_by']
    
    def get_image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" style="max-width: 200px; max-height: 200px;" />'
        return 'Нет изображения'
    get_image_preview.allow_tags = True
    get_image_preview.short_description = 'Превью'


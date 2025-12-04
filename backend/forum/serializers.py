from rest_framework import serializers
from .models import ForumCategory, ForumTopic, ForumPost, ForumLike, ForumImage
from accounts.serializers import UserSerializer


class ForumCategorySerializer(serializers.ModelSerializer):
    """
    Сериализатор для категорий форума
    """
    topics_count = serializers.IntegerField(source='topics.count', read_only=True)
    
    class Meta:
        model = ForumCategory
        fields = ['id', 'name', 'description', 'slug', 'order', 'is_active', 'topics_count', 'created_at']
        read_only_fields = ['id', 'created_at']


class ForumLikeSerializer(serializers.ModelSerializer):
    """
    Сериализатор для лайков
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ForumLike
        fields = ['id', 'user', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class ForumImageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для изображений форума
    """
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumImage
        fields = ['id', 'image', 'image_url', 'topic', 'post', 'uploaded_by', 'created_at']
        read_only_fields = ['id', 'image_url', 'uploaded_by', 'created_at']
    
    def get_image_url(self, obj):
        # Возвращает полную ссылку на изображение
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class ForumPostSerializer(serializers.ModelSerializer):
    """
    Сериализатор для сообщений форума
    """
    author = UserSerializer(read_only=True)
    likes_count = serializers.IntegerField(source='likes.count', read_only=True)
    is_liked = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumPost
        fields = [
            'id', 'topic', 'author', 'content', 'is_edited', 'edited_at',
            'likes_count', 'is_liked', 'images', 'created_at'
        ]
        read_only_fields = ['id', 'author', 'is_edited', 'edited_at', 'created_at']
    
    def get_images(self, obj):
        # Возвращает изображения сообщения
        images = obj.images.all()
        return ForumImageSerializer(images, many=True, context=self.context).data
    
    def get_is_liked(self, obj):
        # Проверяет поставил ли текущий пользователь лайк
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ForumLike.objects.filter(post=obj, user=request.user).exists()
        return False


# Сериализатор для списка тем - упрощенная версия
class ForumTopicListSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=ForumCategory.objects.all(), required=True)
    category_detail = ForumCategorySerializer(source='category', read_only=True)
    posts_count = serializers.IntegerField(source='posts.count', read_only=True)
    last_post_author = serializers.SerializerMethodField()
    last_post_date = serializers.SerializerMethodField()
    content = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = ForumTopic
        fields = [
            'id', 'category', 'category_detail', 'author', 'title', 'content',
            'is_pinned', 'is_locked', 'views_count', 'posts_count', 
            'last_post_author', 'last_post_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'views_count', 'created_at', 'updated_at', 'category_detail']
    
    def get_last_post_author(self, obj):
        # Возвращает кто написал последнее сообщение
        last_post = obj.get_last_post()
        return last_post.author.username if last_post else None
    
    def get_last_post_date(self, obj):
        # Возвращает когда было написано последнее сообщение
        last_post = obj.get_last_post()
        return last_post.created_at if last_post else None


class ForumTopicDetailSerializer(serializers.ModelSerializer):
    """
    Сериализатор для детальной информации о теме
    """
    author = UserSerializer(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=ForumCategory.objects.all(), required=True)
    category_detail = ForumCategorySerializer(source='category', read_only=True)
    posts = ForumPostSerializer(many=True, read_only=True)
    posts_count = serializers.IntegerField(source='posts.count', read_only=True)
    images = serializers.SerializerMethodField()
    
    class Meta:
        model = ForumTopic
        fields = [
            'id', 'category', 'category_detail', 'author', 'title', 'content', 'is_pinned',
            'is_locked', 'views_count', 'posts_count', 'posts', 'images',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'views_count', 'created_at', 'updated_at', 'category_detail']
    
    def get_images(self, obj):
        # Возвращает изображения темы
        images = obj.images.all()
        print(f"DEBUG: get_images для темы {obj.id}: найдено {images.count()} изображений")
        if images.exists():
            for img in images:
                print(f"DEBUG: Изображение {img.id}: topic={img.topic_id}, post={img.post_id}, image={img.image}")
        serialized = ForumImageSerializer(images, many=True, context=self.context).data
        print(f"DEBUG: Сериализованные изображения: {serialized}")
        return serialized


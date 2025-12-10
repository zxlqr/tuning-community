from rest_framework import serializers
from .models import ProductCategory, Product, ProductVariant, Order, OrderItem, Shop, Cart, CartItem


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'order', 'is_active']
        read_only_fields = ['id']


class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = ProductVariant
        fields = [
            'id', 'size', 'color', 'color_hex', 'stock_quantity',
            'price_modifier', 'is_available', 'final_price', 'in_stock'
        ]
        read_only_fields = ['id', 'final_price', 'in_stock']


class ProductSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductCategory.objects.filter(is_active=True),
        source='category',
        write_only=True,
        required=False
    )
    variants = ProductVariantSerializer(many=True, read_only=True)
    in_stock = serializers.BooleanField(read_only=True)
    available_sizes = serializers.ListField(read_only=True)
    available_colors = serializers.ListField(read_only=True)
    size_chart = serializers.DictField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'brand', 'product_type', 'is_clothing',
            'category', 'category_id', 'price', 'image', 'stock_quantity',
            'is_available', 'is_featured', 'characteristics', 'variants',
            'in_stock', 'available_sizes', 'available_colors', 'size_chart',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'available_sizes', 'available_colors', 'size_chart']


# Сериализатор для магазинов
class ShopSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'slug', 'description',
            'logo', 'logo_url', 'order', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'logo_url']
    
    def get_logo_url(self, obj):
        # Возвращает полную ссылку на логотип
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_available=True),
        source='product',
        write_only=True
    )
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'quantity', 'price', 'total']
        read_only_fields = ['id', 'price', 'total']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'delivery_method', 'delivery_address',
            'customer_first_name', 'customer_last_name', 'customer_middle_name', 'customer_phone',
            'total_price', 'notes', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'total_price', 'created_at', 'updated_at']


# Сериализатор для создания нового заказа
class CreateOrderSerializer(serializers.Serializer):
    delivery_method = serializers.ChoiceField(choices=Order.DELIVERY_METHOD_CHOICES)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    customer_first_name = serializers.CharField(max_length=100)
    customer_last_name = serializers.CharField(max_length=100)
    customer_middle_name = serializers.CharField(required=False, allow_blank=True, max_length=100)
    customer_phone = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.IntegerField()
        ),
        min_length=1
    )
    
    def validate_items(self, value):
        # Проверяет что все товары в заказе правильные
        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError("Каждый товар должен содержать product_id и quantity")
            if item['quantity'] < 1:
                raise serializers.ValidationError("Количество должно быть больше 0")
            
            try:
                product = Product.objects.get(id=item['product_id'], is_available=True)
                if product.stock_quantity < item['quantity']:
                    raise serializers.ValidationError(
                        f"Недостаточно товара {product.name} на складе"
                    )
            except Product.DoesNotExist:
                raise serializers.ValidationError(f"Товар с ID {item['product_id']} не найден")
        
        return value
    
    def create(self, validated_data):
        # Создает заказ из валидированных данных
        # Этот метод вызывается serializer.save() в perform_create
        items_data = validated_data.pop('items', [])
        user = validated_data.pop('user')
        status = validated_data.pop('status', 'pending')
        
        order = Order.objects.create(
            user=user,
            status=status,
            **validated_data
        )
        
        return order


# Сериализаторы для корзины
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(is_available=True),
        source='product',
        write_only=True
    )
    variant = ProductVariantSerializer(read_only=True)
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.filter(is_available=True),
        source='variant',
        write_only=True,
        required=False,
        allow_null=True
    )
    item_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = CartItem
        fields = [
            'id', 'product', 'product_id', 'variant', 'variant_id',
            'quantity', 'item_price', 'total_price', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'item_price', 'total_price', 'created_at', 'updated_at']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_items = serializers.IntegerField(read_only=True)
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_items', 'total_price', 'created_at', 'updated_at']
        read_only_fields = ['id', 'total_items', 'total_price', 'created_at', 'updated_at']


# Сериализатор для добавления товара в корзину
class AddToCartSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    
    def validate_product_id(self, value):
        try:
            product = Product.objects.get(id=value, is_available=True)
            return value
        except Product.DoesNotExist:
            raise serializers.ValidationError("Товар не найден или недоступен")
    
    def validate_variant_id(self, value):
        if value is not None:
            try:
                variant = ProductVariant.objects.get(id=value, is_available=True)
                return value
            except ProductVariant.DoesNotExist:
                raise serializers.ValidationError("Вариант товара не найден или недоступен")
        return value


# Сериализатор для обновления количества товара в корзине
class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


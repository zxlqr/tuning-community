from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProductCategory, Product, Order, OrderItem, Shop
from .serializers import (
    ProductCategorySerializer, ProductSerializer,
    OrderSerializer, OrderItemSerializer, CreateOrderSerializer,
    ShopSerializer
)


# API для категорий товаров - только чтение
class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductCategory.objects.filter(is_active=True)
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']


# API для товаров - все могут смотреть, админы могут редактировать
class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_available=True).prefetch_related('variants', 'category')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['category', 'brand', 'product_type', 'is_available', 'is_featured', 'is_clothing']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    
    def get_queryset(self):
        queryset = Product.objects.filter(is_available=True).prefetch_related('variants', 'category')
        
        # Фильтр по бренду
        brand = self.request.query_params.get('brand', None)
        if brand:
            queryset = queryset.filter(brand=brand)
        
        # Фильтр по категории
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category__slug=category)
        
        return queryset


# API для заказов из магазина
class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'delivery_method']
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Order.objects.all().select_related('user').prefetch_related('items__product')
        else:
            return Order.objects.filter(user=user).select_related('user').prefetch_related('items__product')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CreateOrderSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        # Создаем заказ с товарами
        items_data = serializer.validated_data.pop('items', [])
        order = serializer.save(
            user=self.request.user, 
            status='pending'
        )
        
        total_price = 0
        for item_data in items_data:
            # Получаем продукт по product_id из базы данных
            product = Product.objects.get(id=item_data['product_id'])
            quantity = item_data['quantity']
            price = product.price
            
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=quantity,
                price=price
            )
            total_price += price * quantity
        
        order.total_price = total_price
        order.save()
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAdminUser])
    def status(self, request, pk=None):
        # Меняет статус заказа - только для админов
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            return Response(OrderSerializer(order).data)
        return Response(
            {'error': 'Неверный статус'},
            status=status.HTTP_400_BAD_REQUEST
        )


# API для управления магазинами
class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.filter(is_active=True)
    serializer_class = ShopSerializer
    permission_classes = [AllowAny]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description', 'slug']
    ordering_fields = ['order', 'name', 'created_at']
    
    def get_queryset(self):
        # Обычные пользователи видят только активные магазины, админы видят все
        if self.request.user.is_authenticated and (self.request.user.is_staff or self.request.user.is_superuser):
            # Админы видят все магазины
            return Shop.objects.all()
        return Shop.objects.filter(is_active=True).order_by('order', 'name')

from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.urls import reverse
from .models import ProductCategory, Product, ProductVariant, Order, OrderItem, Shop


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'order', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']


# Виджет для редактирования характеристик товара
class CharacteristicsWidget(forms.Textarea):
    
    def __init__(self, attrs=None):
        default_attrs = {
            'rows': 15,
            'cols': 100,
            'class': 'vLargeTextField characteristics-json',
            'style': 'font-family: monospace; font-size: 12px;'
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)


# Форма для товара с удобным редактированием
class ProductAdminForm(forms.ModelForm):
    
    class Meta:
        model = Product
        fields = '__all__'
        widgets = {
            'characteristics': CharacteristicsWidget(),
            'description': forms.Textarea(attrs={'rows': 4, 'cols': 80}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Добавляем подсказки
        self.fields['brand'].help_text = 'Выберите бренд/магазин товара'
        self.fields['product_type'].help_text = 'Тип товара определяет его категорию'
        self.fields['is_clothing'].help_text = 'Отметьте, если товар является одеждой (футболки, худи и т.д.)'
        self.fields['characteristics'].help_text = format_html(
            '<div style="background: #f0f0f0; padding: 10px; border-radius: 4px; margin-top: 5px;">'
            '<strong>Пример JSON для одежды:</strong><br>'
            '<pre style="margin: 5px 0;">'
            '{{\n'
            '  "sizes": ["S", "M", "L", "XL", "XXL"],\n'
            '  "colors": [\n'
            '    {{"name": "Черный", "value": "black", "hex": "#000000"}},\n'
            '    {{"name": "Белый", "value": "white", "hex": "#ffffff"}}\n'
            '  ],\n'
            '  "size_chart": {{\n'
            '    "A": {{"S": 56, "M": 58, "L": 60, "XL": 62, "XXL": 64}},\n'
            '    "B": {{"S": 74, "M": 76, "L": 78, "XL": 80, "XXL": 82}},\n'
            '    "C": {{"S": 21, "M": 22, "L": 23, "XL": 24, "XXL": 25}},\n'
            '    "D": {{"S": 16, "M": 17, "L": 18, "XL": 19, "XXL": 20}}\n'
            '  }},\n'
            '  "characteristics": ["100% хлопок", "плотность 260 г/м²", "оверсайз фит"],\n'
            '  "bonus": "Бонус: наклейка",\n'
            '  "note": "Мокап может иметь незначительные отличия от оригинала"\n'
            '}}'
            '</pre>'
            '</div>'
        )


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 3
    fields = ['size', 'color', 'color_hex', 'stock_quantity', 'price_modifier', 'is_available']
    verbose_name = 'Вариант товара'
    verbose_name_plural = 'Варианты товара (размеры и цвета)'
    
    class Media:
        css = {
            'all': ('admin/css/product_variants.css',)
        }
    
    def get_fields(self, request, obj=None):
        # Если товар не является одеждой, скрываем поля размера и цвета
        if obj and not obj.is_clothing:
            return ['stock_quantity', 'price_modifier', 'is_available']
        return super().get_fields(request, obj)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ['name', 'brand_badge', 'product_type_badge', 'category', 'price', 'stock_status', 'is_featured', 'is_clothing']
    list_filter = ['brand', 'product_type', 'category', 'is_available', 'is_featured', 'is_clothing', 'created_at']
    search_fields = ['name', 'description']
    readonly_fields = ['created_at', 'updated_at', 'available_sizes', 'available_colors', 'preview_image']
    inlines = [ProductVariantInline]
    list_per_page = 25
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'description', 'brand', 'product_type', 'category'),
            'description': 'Заполните основную информацию о товаре'
        }),
        ('Цена и наличие', {
            'fields': ('price', 'stock_quantity', 'is_available', 'is_featured'),
            'description': 'Укажите цену и количество товара на складе'
        }),
        ('Одежда', {
            'fields': ('is_clothing', 'characteristics', 'available_sizes', 'available_colors'),
            'classes': ('collapse',),
            'description': 'Заполните только если товар является одеждой'
        }),
        ('Изображение', {
            'fields': ('image', 'preview_image'),
            'description': 'Загрузите изображение товара'
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['create_test_products', 'mark_as_featured', 'mark_as_available']
    
    def brand_badge(self, obj):
        colors = {
            'stputyxa': '#e7dfcc',
            'gohard': '#00cccc'
        }
        color = colors.get(obj.brand, '#666')
        return format_html(
            '<span style="background-color: {}; color: #000; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_brand_display()
        )
    brand_badge.short_description = 'Бренд'
    
    def product_type_badge(self, obj):
        return format_html(
            '<span style="background-color: #333; color: #fff; padding: 3px 8px; border-radius: 3px;">{}</span>',
            obj.get_product_type_display()
        )
    product_type_badge.short_description = 'Тип'
    
    def stock_status(self, obj):
        if obj.in_stock:
            return format_html('<span style="color: #4caf50; font-weight: bold;">В наличии</span>')
        return format_html('<span style="color: #f44336;">Нет в наличии</span>')
    stock_status.short_description = 'Наличие'
    
    def preview_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 200px; max-height: 200px; border-radius: 4px;" />',
                obj.image.url
            )
        return 'Нет изображения'
    preview_image.short_description = 'Предпросмотр'
    
    def create_test_products(self, request, queryset):
        # Создает тестовые товары для проверки
        from django.utils import timezone
        
        # Создаем тестовые категории если их нет
        sticker_cat, _ = ProductCategory.objects.get_or_create(
            slug='stickers',
            defaults={'name': 'Наклейки', 'order': 1}
        )
        clothing_cat, _ = ProductCategory.objects.get_or_create(
            slug='clothing',
            defaults={'name': 'Одежда', 'order': 2}
        )
        
        # Тестовые наклейки для Stputyxa
        test_products = [
            {
                'name': 'Стикер Классика',
                'description': 'Кайфовее всего выглядит на передних дверях, посередине заднего стекла',
                'brand': 'stputyxa',
                'product_type': 'sticker',
                'category': sticker_cat,
                'price': 200,
                'stock_quantity': 50,
                'is_clothing': False,
            },
            {
                'name': 'Стикер "Гоухард — это стиль жизни!"',
                'description': 'Лимитированная серия наклеек',
                'brand': 'stputyxa',
                'product_type': 'sticker',
                'category': sticker_cat,
                'price': 500,
                'stock_quantity': 0,
                'is_clothing': False,
            },
            {
                'name': 'Стикер RSD',
                'description': 'Real Street Drift',
                'brand': 'stputyxa',
                'product_type': 'sticker',
                'category': sticker_cat,
                'price': 250,
                'stock_quantity': 30,
                'is_clothing': False,
            },
            # Одежда для GO HARD
            {
                'name': 'Футболки от GO HARD WEAR',
                'description': 'Оверсайз футболка с вышивкой на груди и принтом на спине',
                'brand': 'gohard',
                'product_type': 'clothing',
                'category': clothing_cat,
                'price': 4990,
                'stock_quantity': 100,
                'is_clothing': True,
                'characteristics': {
                    'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
                    'colors': [
                        {'name': 'Черный', 'value': 'black', 'hex': '#000000'},
                        {'name': 'Белый', 'value': 'white', 'hex': '#ffffff'}
                    ],
                    'size_chart': {
                        'A': {'S': 56, 'M': 58, 'L': 60, 'XL': 62, 'XXL': 64},
                        'B': {'S': 74, 'M': 76, 'L': 78, 'XL': 80, 'XXL': 82},
                        'C': {'S': 21, 'M': 22, 'L': 23, 'XL': 24, 'XXL': 25},
                        'D': {'S': 16, 'M': 17, 'L': 18, 'XL': 19, 'XXL': 20}
                    },
                    'characteristics': ['100% хлопок', 'плотность 260 г/м²', 'оверсайз фит'],
                    'bonus': 'Бонус: наклейка',
                    'note': 'Мокап может иметь незначительные отличия от оригинала'
                }
            },
            {
                'name': 'Лонгсливы от GO HARD WEAR',
                'description': 'Длинный рукав с принтом',
                'brand': 'gohard',
                'product_type': 'clothing',
                'category': clothing_cat,
                'price': 6490,
                'stock_quantity': 50,
                'is_clothing': True,
                'characteristics': {
                    'sizes': ['S', 'M', 'L', 'XL', 'XXL'],
                    'colors': [
                        {'name': 'Черный', 'value': 'black', 'hex': '#000000'}
                    ],
                    'size_chart': {
                        'A': {'S': 56, 'M': 58, 'L': 60, 'XL': 62, 'XXL': 64},
                        'B': {'S': 74, 'M': 76, 'L': 78, 'XL': 80, 'XXL': 82},
                        'C': {'S': 21, 'M': 22, 'L': 23, 'XL': 24, 'XXL': 25},
                        'D': {'S': 16, 'M': 17, 'L': 18, 'XL': 19, 'XXL': 20}
                    },
                    'characteristics': ['100% хлопок', 'плотность 260 г/м²', 'оверсайз фит'],
                    'bonus': 'Бонус: наклейка'
                }
            },
        ]
        
        created_count = 0
        for product_data in test_products:
            product, created = Product.objects.get_or_create(
                name=product_data['name'],
                brand=product_data['brand'],
                defaults=product_data
            )
            if created:
                created_count += 1
                # Создаем варианты для одежды
                if product.is_clothing and 'characteristics' in product_data:
                    chars = product_data['characteristics']
                    if 'sizes' in chars and 'colors' in chars:
                        for size in chars['sizes']:
                            for color_data in chars['colors']:
                                ProductVariant.objects.get_or_create(
                                    product=product,
                                    size=size,
                                    color=color_data['value'],
                                    defaults={
                                        'color_hex': color_data['hex'],
                                        'stock_quantity': 10,
                                        'is_available': True
                                    }
                                )
        
        self.message_user(request, f'Создано {created_count} тестовых товаров')
    create_test_products.short_description = 'Создать тестовые товары'
    
    def mark_as_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f'Отмечено как рекомендуемые: {queryset.count()} товаров')
    mark_as_featured.short_description = 'Отметить как рекомендуемые'
    
    def mark_as_available(self, request, queryset):
        queryset.update(is_available=True)
        self.message_user(request, f'Отмечено как доступные: {queryset.count()} товаров')
    mark_as_available.short_description = 'Отметить как доступные'


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'color_badge', 'stock_quantity', 'price_modifier', 'is_available', 'in_stock_display']
    list_filter = ['is_available', 'product__brand', 'product__product_type', 'product']
    search_fields = ['product__name', 'size', 'color']
    list_editable = ['stock_quantity', 'is_available']
    
    def color_badge(self, obj):
        if obj.color_hex:
            is_dark = self._is_dark_color(obj.color_hex)
            return format_html(
                '<span style="background-color: {}; color: {}; padding: 3px 8px; border-radius: 3px; border: 1px solid #ccc;">{}</span>',
                obj.color_hex,
                '#fff' if is_dark else '#000',
                obj.color or '-'
            )
        return obj.color or '-'
    color_badge.short_description = 'Цвет'
    
    def in_stock_display(self, obj):
        if obj.in_stock:
            return format_html('<span style="color: #4caf50;">Да</span>')
        return format_html('<span style="color: #f44336;">Нет</span>')
    in_stock_display.short_description = 'В наличии'
    
    @staticmethod
    def _is_dark_color(hex_color):
        # Проверяет темный ли цвет для правильного отображения бейджа
        try:
            hex_color = hex_color.lstrip('#')
            r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)
            brightness = (r * 299 + g * 587 + b * 114) / 1000
            return brightness < 128
        except:
            return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status_badge', 'delivery_method', 'total_price', 'items_count', 'created_at']
    list_filter = ['status', 'delivery_method', 'created_at']
    search_fields = ['user__username', 'id']
    readonly_fields = ['created_at', 'updated_at', 'items_list']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'status', 'delivery_method', 'delivery_address')
        }),
        ('Товары', {
            'fields': ('items_list', 'total_price')
        }),
        ('Дополнительно', {
            'fields': ('notes', 'created_at', 'updated_at')
        }),
    )
    
    def status_badge(self, obj):
        colors = {
            'pending': '#ff9800',
            'paid': '#2196f3',
            'processing': '#9c27b0',
            'shipped': '#00bcd4',
            'delivered': '#4caf50',
            'cancelled': '#f44336'
        }
        color = colors.get(obj.status, '#666')
        return format_html(
            '<span style="background-color: {}; color: #fff; padding: 3px 8px; border-radius: 3px; font-weight: bold;">{}</span>',
            color,
            obj.get_status_display()
        )
    status_badge.short_description = 'Статус'
    
    def items_count(self, obj):
        count = obj.items.count()
        return f'{count} товар(ов)'
    items_count.short_description = 'Товаров'
    
    def items_list(self, obj):
        items = obj.items.all()
        if not items:
            return 'Нет товаров'
        html = '<ul>'
        for item in items:
            html += f'<li>{item.product.name} - {item.quantity} шт. × {item.price} ₽ = {item.total} ₽</li>'
        html += '</ul>'
        return format_html(html)
    items_list.short_description = 'Список товаров'


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price', 'total']
    list_filter = ['order__status', 'order']
    search_fields = ['product__name', 'order__id']
    readonly_fields = ['total']


# Админка для управления магазинами
@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ['logo_preview_list', 'name', 'slug', 'order', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug', 'description']
    ordering = ['order', 'name']
    readonly_fields = ['created_at', 'updated_at', 'logo_preview', 'slug']
    
    fieldsets = (
        ('Логотип магазина', {
            'fields': ('logo', 'logo_preview'),
            'description': 'Загрузите логотип магазина. Остальные поля необязательны - slug создастся автоматически.'
        }),
        ('Дополнительно (необязательно)', {
            'fields': ('name', 'slug', 'description', 'order', 'is_active'),
            'classes': ('collapse',)
        }),
        ('Системная информация', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def logo_preview_list(self, obj):
        # Показывает маленькое превью логотипа в списке
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-height: 50px; max-width: 150px; object-fit: contain;" />',
                obj.logo.url
            )
        return format_html('<span style="color: #999;">Нет логотипа</span>')
    logo_preview_list.short_description = 'Логотип'
    
    def logo_preview(self, obj):
        # Показывает большое превью логотипа на странице редактирования
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-height: 200px; max-width: 300px; object-fit: contain;" />',
                obj.logo.url
            )
        return 'Логотип не загружен'
    logo_preview.short_description = 'Превью логотипа'

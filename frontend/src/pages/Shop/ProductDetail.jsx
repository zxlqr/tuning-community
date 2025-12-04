import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import apiClient from '../../api/client'
import { useCart } from '../../contexts/CartContext'
import './ProductDetail.css'

// Страница товара с подробной информацией
const ProductDetail = () => {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const { addToCart, isInCart, getItemQuantity } = useCart()

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['shop-product', productId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/shop/products/${productId}/`)
        return response.data
      } catch (err) {
        console.error('Error loading product:', err)
        throw err
      }
    },
    retry: 1,
    enabled: !!productId,
  })

  // Определяем, является ли товар одеждой (всегда вычисляем, даже если product еще не загружен)
  const isClothing = product?.is_clothing || 
                     product?.product_type === 'clothing' ||
                     product?.category?.slug === 'clothing' || 
                     product?.category?.slug === 'wear' ||
                     product?.category?.name?.toLowerCase().includes('одежда') ||
                     product?.category?.name?.toLowerCase().includes('футболка') ||
                     product?.category?.name?.toLowerCase().includes('худи')

  // Если это одежда, перенаправляем на специальную страницу
  useEffect(() => {
    if (product && isClothing) {
      navigate(`/shop/product/${productId}/clothing`, { replace: true })
    }
  }, [product, isClothing, productId, navigate])

  if (isLoading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-background"></div>
        <div className="product-detail-container">
          <h1>Загрузка...</h1>
        </div>
      </div>
    )
  }

  if (error || (!isLoading && !product)) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-background"></div>
        <div className="product-detail-container">
          <h1 style={{ color: '#fff', marginBottom: '1rem' }}>Товар не найден</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '2rem' }}>
            Товар с ID {productId} не существует или был удален.
          </p>
          <Link to="/shop" className="back-link" style={{ fontSize: '1.1rem', padding: '0.8rem 1.5rem', border: '2px solid #e7dfcc', borderRadius: '8px', display: 'inline-block' }}>
            ← Вернуться в магазин
          </Link>
        </div>
      </div>
    )
  }

  // Если это одежда, показываем пустой экран (будет редирект)
  if (product && isClothing) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-background"></div>
        <div className="product-detail-container">
          <h1>Перенаправление...</h1>
        </div>
      </div>
    )
  }

  // Получаем изображения - может быть одно или несколько
  // Проверяем разные варианты полей для изображения
  const productImage = product.image || product.image_url || product.photo || product.photo_url
  const images = productImage ? [productImage] : []
  
  // Получаем характеристики из JSON поля или используем пустой объект
  const characteristics = product.characteristics || {}
  
  // Формируем список характеристик для отображения
  const specs = []
  if (characteristics.sizes) {
    specs.push({ label: 'Размеры', value: characteristics.sizes })
  }
  if (characteristics.colors) {
    const colorsList = Array.isArray(characteristics.colors) 
      ? characteristics.colors.join(', ') 
      : characteristics.colors
    specs.push({ label: 'Цвета', value: colorsList })
  }
  if (characteristics.variants) {
    const variantsList = Array.isArray(characteristics.variants)
      ? characteristics.variants.join(', ')
      : characteristics.variants
    specs.push({ label: 'Варианты', value: variantsList })
  }
  
  // Если есть другие поля в characteristics, добавляем их
  Object.keys(characteristics).forEach(key => {
    if (!['sizes', 'colors', 'variants', 'size_chart'].includes(key)) {
      const value = characteristics[key]
      if (value) {
        specs.push({ 
          label: key.charAt(0).toUpperCase() + key.slice(1), 
          value: typeof value === 'object' ? JSON.stringify(value) : value 
        })
      }
    }
  })

  return (
    <div className="product-detail-page">
      <div className="product-detail-background"></div>
      <div className="product-detail-container">
        <Link to="/shop" className="back-link">← Назад к магазинам</Link>
        
        <div className="product-detail-content">
          <div className="product-images">
            {images.length > 0 ? (
              <>
                <div className="product-main-image">
                  <img 
                    src={images[selectedImageIndex]} 
                    alt={product.name}
                    onError={(e) => {
                      console.error('Failed to load product image:', images[selectedImageIndex])
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div style="color: rgba(255,255,255,0.5); text-align: center; padding: 2rem;">Изображение не загружено</div>'
                    }}
                  />
                </div>
                {images.length > 1 && (
                  <div className="product-thumbnails">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        className={`thumbnail ${selectedImageIndex === index ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img src={img} alt={`${product.name} ${index + 1}`} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="product-no-image">Нет изображения</div>
            )}
          </div>

          <div className="product-details">
            {product.brand && (
              <div className="product-brand">{product.brand}</div>
            )}
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price">{product.price}₽</div>
            
            {product.description && (
              <div className="product-description">
                <p>{product.description}</p>
              </div>
            )}

            {specs.length > 0 && (
              <div className="product-specs">
                {specs.map((spec, index) => (
                  <div key={index} className="spec-item">
                    <strong>{spec.label}:</strong> {spec.value}
                  </div>
                ))}
              </div>
            )}

            <div className="product-actions">
              {product.in_stock ? (
                <>
                  {isInCart(product.id) ? (
                    <div className="cart-status">
                      <p className="in-cart-message">Товар в корзине ({getItemQuantity(product.id)} шт.)</p>
                      <Link to="/cart" className="btn-go-to-cart">
                        Перейти в корзину
                      </Link>
                    </div>
                  ) : (
                    <>
                      <div className="quantity-selector">
                        <label>Количество:</label>
                        <div className="quantity-controls">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="quantity-btn"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="quantity-input"
                          />
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="quantity-btn"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(product, quantity)
                          alert('Товар добавлен в корзину!')
                        }}
                        className="btn-add-to-cart"
                      >
                        <span>🛒</span>
                        В корзину
                      </button>
                    </>
                  )}
                </>
              ) : (
                <button className="btn-out-of-stock" disabled>
                  Нет в наличии
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail


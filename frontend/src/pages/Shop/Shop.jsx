import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import apiClient from '../../api/client'
import VideoBackground from '../../components/VideoBackground/VideoBackground'
import '../../styles/page-background.css'
import './Shop.css'

// Главная страница магазина - показывает все магазины/бренды
const Shop = () => {
  // Загружаем магазины из API
  const { data: shops, isLoading } = useQuery({
    queryKey: ['shops'],
    queryFn: () => apiClient.get('/shop/shops/').then(res => res.data),
  })
  
  const shopsList = shops?.results || shops || []

  if (isLoading) {
    return (
      <div className="shop page-background">
        <VideoBackground videoSrc="/videos/1119.mp4" />
        <div className="shop-container">
          <h1 className="shop-title">Магазин</h1>
          <p style={{ color: '#fff', textAlign: 'center' }}>Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shop page-background">
      <VideoBackground videoSrc="/videos/1119.mp4" />
      <div className="shop-container">
        <h1 className="shop-title">Магазин</h1>
        
        {shopsList.length > 0 ? (
          <div className="shops-grid">
            {shopsList.map(shop => (
              <ShopBrandCard key={shop.id} shop={shop} />
            ))}
          </div>
        ) : (
          <p style={{ color: '#fff', textAlign: 'center' }}>Магазины скоро появятся</p>
        )}
      </div>
    </div>
  )
}

/**
 * Карточка магазина с логотипом и каруселью товаров
 */
const ShopBrandCard = ({ shop }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Загружаем товары для этого магазина
  const { data: productsData } = useQuery({
    queryKey: ['shop-products-preview', shop.slug],
    queryFn: () => apiClient.get('/shop/products/', {
      params: { brand: shop.slug }
    }).then(res => res.data),
    enabled: !!shop.slug
  })
  
  const products = productsData?.results || productsData || []
  const visibleProducts = products.slice(0, 6) // Показываем до 6 товаров
  
  const nextSlide = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (visibleProducts.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % visibleProducts.length)
    }
  }
  
  const prevSlide = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (visibleProducts.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + visibleProducts.length) % visibleProducts.length)
    }
  }

  return (
    <div className="shop-brand-card-wrapper">
      <Link 
        to={`/shop/${shop.slug}`}
        className="shop-brand-card"
      >
        <div className="shop-brand-header-section">
          <div className="shop-brand-logo">
            {shop.logo_url ? (
              <img 
                src={shop.logo_url} 
                alt={shop.name || 'Магазин'}
                className={shop.slug === 'stputyxa' ? 'logo-stputyxa' : ''}
                style={shop.slug === 'stputyxa' ? { 
                  minHeight: '450px',
                  maxHeight: '500px',
                  width: 'auto'
                } : {}}
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
            ) : (
              <div className="shop-brand-logo-fallback">
                {shop.name || 'Магазин'}
              </div>
            )}
          </div>
        </div>
        
        {/* Карусель товаров */}
        {visibleProducts.length > 0 && (
          <div className="shop-products-carousel" onClick={(e) => e.preventDefault()}>
            <div className="carousel-container">
              {visibleProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/shop/product/${product.id}`}
                  className={`carousel-item ${index === currentSlide ? 'active' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {product.image && (
                    <div className="carousel-product-image">
                      <img src={product.image} alt={product.name} />
                      {product.is_featured && (
                        <span className="product-badge-new">NEW</span>
                      )}
                    </div>
                  )}
                  <div className="carousel-product-info">
                    <h4 className="carousel-product-name">{product.name}</h4>
                    <div className="carousel-product-price">{product.price} ₽</div>
                  </div>
                </Link>
              ))}
            </div>
            
            {visibleProducts.length > 1 && (
              <>
                <button 
                  className="carousel-btn carousel-btn-prev"
                  onClick={prevSlide}
                  aria-label="Предыдущий товар"
                >
                  ‹
                </button>
                <button 
                  className="carousel-btn carousel-btn-next"
                  onClick={nextSlide}
                  aria-label="Следующий товар"
                >
                  ›
                </button>
                <div className="carousel-dots">
                  {visibleProducts.map((_, index) => (
                    <button
                      key={index}
                      className={`carousel-dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setCurrentSlide(index)
                      }}
                      aria-label={`Перейти к товару ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        
        <div className="shop-brand-info">
          <span className="shop-brand-link">Смотреть товары →</span>
        </div>
      </Link>
    </div>
  )
}

export default Shop

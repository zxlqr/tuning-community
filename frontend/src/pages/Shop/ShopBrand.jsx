import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../../api/client'
import './ShopBrand.css'

// Страница одного магазина/бренда - показывает все его товары
const ShopBrand = () => {
  const { brandSlug } = useParams()

  // Маппинг slug на название бренда
  const brandNames = {
    'stputyxa': 'Stputyxa',
    'gohard': 'GO HARD'
  }

  const brandName = brandNames[brandSlug] || brandSlug

  // Загружаем товары бренда
  const { data: products, isLoading } = useQuery({
    queryKey: ['shop-products', brandSlug],
    queryFn: () => apiClient.get('/shop/products/', {
      params: { brand: brandSlug }
    }).then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="shop-brand">
        <div className="shop-brand-container">
          <h1>Загрузка...</h1>
        </div>
      </div>
    )
  }

  const productsList = products?.results || products || []

  return (
    <div className="shop-brand">
      <div className="shop-brand-container">
        <Link to="/shop" className="back-link">← Назад к магазинам</Link>
        
        <div className="shop-brand-header">
          <h1 className="shop-brand-title">{brandName} Shop</h1>
        </div>

        <div className="products-grid">
          {productsList.length > 0 ? (
            productsList.map(product => (
              <Link 
                key={product.id} 
                to={`/shop/product/${product.id}`}
                className="product-card"
              >
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="product-image-placeholder">
                      <span>Нет изображения</span>
                    </div>
                  )}
                  {product.is_featured && (
                    <div className="product-badge featured">NEW</div>
                  )}
                </div>
                <div className="product-info">
                  {product.brand && (
                    <p className="product-brand">{product.brand}</p>
                  )}
                  <h3 className="product-name">{product.name}</h3>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  <div className="product-footer">
                    <span className="product-price">{product.price} ₽</span>
                    {product.in_stock ? (
                      <span className="product-stock in-stock">В наличии</span>
                    ) : (
                      <span className="product-stock out-of-stock">Нет в наличии</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="no-products">Товары скоро появятся</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ShopBrand


import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import apiClient from '../../api/client'
import VideoBackground from '../../components/VideoBackground/VideoBackground'
import '../../styles/page-background.css'
import './ProductDetailClothing.css'

// Страница товара-одежды - выбор размера и цвета
const ProductDetailClothing = () => {
  const { productId } = useParams()
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  const { data: product, isLoading } = useQuery({
    queryKey: ['shop-product', productId],
    queryFn: () => apiClient.get(`/shop/products/${productId}/`).then(res => res.data),
  })

  // Получаем размеры и цвета из API или используем значения по умолчанию
  const sizes = product?.available_sizes?.length > 0 
    ? product.available_sizes 
    : ['S', 'M', 'L', 'XL', 'XXL']
  
  // Получаем цвета из вариантов товара или используем значения по умолчанию
  const colorsFromVariants = product?.variants?.reduce((acc, variant) => {
    if (variant.color && variant.color_hex) {
      const existing = acc.find(c => c.value === variant.color)
      if (!existing) {
        acc.push({
          name: variant.color,
          value: variant.color,
          hex: variant.color_hex
        })
      }
    }
    return acc
  }, []) || []
  
  const colors = colorsFromVariants.length > 0 
    ? colorsFromVariants 
    : [
        { name: 'Черный', value: 'black', hex: '#000000' },
        { name: 'Белый', value: 'white', hex: '#ffffff' },
      ]

  // Таблица размеров из API или значения по умолчанию
  const sizeChart = product?.size_chart && Object.keys(product.size_chart).length > 0
    ? product.size_chart
    : {
        'A': { S: 56, M: 58, L: 60, XL: 62, XXL: 64 },
        'B': { S: 74, M: 76, L: 78, XL: 80, XXL: 82 },
        'C': { S: 21, M: 22, L: 23, XL: 24, XXL: 25 },
        'D': { S: 16, M: 17, L: 18, XL: 19, XXL: 20 },
      }

  if (isLoading) {
    return (
      <div className="product-detail-clothing page-background">
        <VideoBackground videoSrc="/videos/1119.mp4" />
        <div className="product-detail-clothing-container">
          <h1>Загрузка...</h1>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-detail-clothing page-background">
        <VideoBackground videoSrc="/videos/1119.mp4" />
        <div className="product-detail-clothing-container">
          <h1>Товар не найден</h1>
          <Link to="/shop">Вернуться в магазин</Link>
        </div>
      </div>
    )
  }

  const images = product.image ? [product.image] : []

  return (
    <div className="product-detail-clothing page-background">
      <VideoBackground videoSrc="/videos/1119.mp4" />
      <div className="product-detail-clothing-container">
        <Link to="/shop" className="back-link">← Назад к магазинам</Link>
        
        <div className="product-detail-clothing-content">
          <div className="product-images-section">
            {images.length > 0 ? (
              <>
                <div className="product-main-image">
                  <img 
                    src={images[selectedImageIndex]} 
                    alt={product.name}
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

          <div className="product-details-section">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-price">{product.price} ₽</div>
            
            {/* Выбор размера */}
            <div className="product-size-selector">
              <label>Размер</label>
              <div className="size-options">
                {sizes.map(size => (
                  <button
                    key={size}
                    className={`size-option ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Выбор цвета */}
            <div className="product-color-selector">
              <label>Цвет</label>
              <div className="color-options">
                {colors.map(color => (
                  <button
                    key={color.value}
                    className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                    onClick={() => setSelectedColor(color.value)}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Описание */}
            {product.description && (
              <div className="product-description">
                <p>{product.description}</p>
              </div>
            )}

            {/* Характеристики */}
            {product.characteristics && (
              <div className="product-characteristics">
                <h3>Характеристики:</h3>
                {product.characteristics.characteristics ? (
                  <ul>
                    {product.characteristics.characteristics.map((char, index) => (
                      <li key={index}>→ {char}</li>
                    ))}
                  </ul>
                ) : (
                  <ul>
                    <li>→ 100% хлопок;</li>
                    <li>→ плотность 260 г/м²;</li>
                    <li>→ оверсайз фит.</li>
                  </ul>
                )}
                {product.characteristics.bonus && (
                  <p className="product-note">* {product.characteristics.bonus}</p>
                )}
                {product.characteristics.note && (
                  <p className="product-note">* {product.characteristics.note}</p>
                )}
              </div>
            )}

            {/* Кнопка покупки */}
            {product.in_stock && (
              <button 
                className="btn-buy"
                disabled={!selectedSize || !selectedColor}
              >
                Купить
              </button>
            )}

            {/* Таблица размеров */}
            <div className="size-chart">
              <h3>Таблица размеров</h3>
              <div className="size-chart-diagrams">
                <div className="tshirt-diagram front">
                  <svg viewBox="0 0 200 300" className="tshirt-svg">
                    <path d="M 50 50 L 150 50 L 150 80 L 130 100 L 130 250 L 70 250 L 70 100 L 50 80 Z" 
                          fill="none" stroke="#ffffff" strokeWidth="2"/>
                    <text x="100" y="40" textAnchor="middle" fill="#ffffff" fontSize="12">A</text>
                    <text x="100" y="95" textAnchor="middle" fill="#ffffff" fontSize="12">B</text>
                    <text x="170" y="175" textAnchor="middle" fill="#ffffff" fontSize="12">C</text>
                    <text x="100" y="75" textAnchor="middle" fill="#ffffff" fontSize="12">D</text>
                  </svg>
                </div>
                <div className="tshirt-diagram back">
                  <svg viewBox="0 0 200 300" className="tshirt-svg">
                    <path d="M 50 50 L 150 50 L 150 80 L 130 100 L 130 250 L 70 250 L 70 100 L 50 80 Z" 
                          fill="none" stroke="#ffffff" strokeWidth="2"/>
                  </svg>
                </div>
              </div>
              <div className="size-chart-table">
                <table>
                  <thead>
                    <tr>
                      <th></th>
                      {sizes.map(size => (
                        <th key={size}>{size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(sizeChart).map(([measure, values]) => (
                      <tr key={measure}>
                        <td><strong>{measure}</strong></td>
                        {sizes.map(size => (
                          <td key={size}>{values[size]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailClothing


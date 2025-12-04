import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

// Провайдер корзины - хранит товары и управляет ими
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])

  // Загружаем корзину из localStorage при монтировании
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
        localStorage.removeItem('cart')
      }
    }
  }, [])

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  // Добавляет товар в корзину
  const addToCart = (product, quantity = 1, variant = null) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && 
        (!variant || item.variant?.id === variant?.id)
      )

      if (existingItemIndex >= 0) {
        // Товар уже в корзине, увеличиваем количество
        const newItems = [...prevItems]
        newItems[existingItemIndex].quantity += quantity
        return newItems
      } else {
        // Новый товар, добавляем в корзину
        return [...prevItems, {
          product,
          quantity,
          variant,
          addedAt: new Date().toISOString()
        }]
      }
    })
  }

  // Удаляет товар из корзины
  const removeFromCart = (productId, variantId = null) => {
    setCartItems(prevItems =>
      prevItems.filter(
        item => !(item.product.id === productId && 
        (!variantId || item.variant?.id === variantId))
      )
    )
  }

  // Меняет количество товара в корзине
  const updateQuantity = (productId, quantity, variantId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId)
      return
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId && 
        (!variantId || item.variant?.id === variantId)
          ? { ...item, quantity }
          : item
      )
    )
  }

  // Очищает всю корзину
  const clearCart = () => {
    setCartItems([])
    localStorage.removeItem('cart')
  }

  // Считает сколько всего товаров в корзине
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0)
  }

  // Считает общую стоимость всех товаров в корзине
  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = item.variant?.final_price || item.product.price
      return total + (itemPrice * item.quantity)
    }, 0)
  }

  // Проверяет есть ли товар в корзине
  const isInCart = (productId, variantId = null) => {
    return cartItems.some(
      item => item.product.id === productId && 
      (!variantId || item.variant?.id === variantId)
    )
  }

  // Возвращает сколько штук конкретного товара в корзине
  const getItemQuantity = (productId, variantId = null) => {
    const item = cartItems.find(
      item => item.product.id === productId && 
      (!variantId || item.variant?.id === variantId)
    )
    return item ? item.quantity : 0
  }

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isInCart,
    getItemQuantity
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Хук для работы с корзиной
export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}


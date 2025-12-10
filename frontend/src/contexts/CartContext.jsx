import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { cartAPI } from '../api/cart'

const CartContext = createContext()

// Провайдер корзины - хранит товары и управляет ими
// Синхронизируется с сервером для авторизованных пользователей
export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const { isAuthenticated, user } = useAuth()

  // Загружаем корзину с сервера или из localStorage
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)
      try {
        if (isAuthenticated && user) {
          // Для авторизованных пользователей загружаем с сервера
          try {
            const response = await cartAPI.getCart()
            const serverCart = response.data.items || []
            setCartItems(serverCart.map(item => ({
              product: item.product,
              variant: item.variant,
              quantity: item.quantity,
              id: item.id
            })))
          } catch (error) {
            console.error('Error loading cart from server:', error)
            // Если ошибка, пробуем загрузить из localStorage
            loadFromLocalStorage()
          }
        } else {
          // Для неавторизованных пользователей используем localStorage
          loadFromLocalStorage()
        }
      } catch (error) {
        console.error('Error loading cart:', error)
      } finally {
        setLoading(false)
      }
    }
    
    const loadFromLocalStorage = () => {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart) && parsedCart.length > 0) {
            const validCart = parsedCart.filter(item => 
              item && 
              item.product && 
              item.product.id && 
              typeof item.quantity === 'number' && 
              item.quantity > 0
            )
            if (validCart.length > 0) {
              setCartItems(validCart)
            } else {
              localStorage.removeItem('cart')
            }
          } else if (Array.isArray(parsedCart)) {
            setCartItems([])
          } else {
            localStorage.removeItem('cart')
          }
        } catch (error) {
          console.error('Error loading cart from localStorage:', error)
          localStorage.removeItem('cart')
        }
      }
    }
    
    loadCart()
  }, [isAuthenticated, user])

  // Сохраняем корзину на сервер (для авторизованных) или в localStorage
  useEffect(() => {
    // Пропускаем сохранение при первой загрузке
    if (loading) return
    
    const saveCart = async () => {
      try {
        if (isAuthenticated && user) {
          // Для авторизованных пользователей сохраняем на сервер
          // Но не делаем запрос при каждом изменении - только при явных действиях
          // Здесь только localStorage как резерв
        }
        
        // Всегда сохраняем в localStorage как резерв
        if (cartItems.length > 0) {
          localStorage.setItem('cart', JSON.stringify(cartItems))
        } else {
          localStorage.removeItem('cart')
        }
      } catch (error) {
        console.error('Error saving cart:', error)
      }
    }
    
    saveCart()
  }, [cartItems, isAuthenticated, user, loading])

  // Добавляет товар в корзину
  const addToCart = async (product, quantity = 1, variant = null) => {
    if (isAuthenticated && user) {
      // Для авторизованных пользователей сохраняем на сервер
      try {
        await cartAPI.addItem(product.id, variant?.id || null, quantity)
        // Обновляем локальное состояние после успешного добавления
        const response = await cartAPI.getCart()
        const serverCart = response.data.items || []
        setCartItems(serverCart.map(item => ({
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          id: item.id
        })))
      } catch (error) {
        console.error('Error adding item to cart on server:', error)
        // При ошибке добавляем локально
        addToCartLocal(product, quantity, variant)
      }
    } else {
      // Для неавторизованных пользователей только локально
      addToCartLocal(product, quantity, variant)
    }
  }
  
  const addToCartLocal = (product, quantity = 1, variant = null) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.product.id === product.id && 
        (!variant || item.variant?.id === variant?.id)
      )

      if (existingItemIndex >= 0) {
        const newItems = [...prevItems]
        newItems[existingItemIndex].quantity += quantity
        return newItems
      } else {
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
  const removeFromCart = async (productId, variantId = null, itemId = null) => {
    if (isAuthenticated && user && itemId) {
      // Для авторизованных пользователей удаляем на сервере
      try {
        await cartAPI.removeItem(itemId)
        // Обновляем локальное состояние
        const response = await cartAPI.getCart()
        const serverCart = response.data.items || []
        setCartItems(serverCart.map(item => ({
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          id: item.id
        })))
      } catch (error) {
        console.error('Error removing item from cart on server:', error)
        // При ошибке удаляем локально
        removeFromCartLocal(productId, variantId)
      }
    } else {
      // Для неавторизованных пользователей только локально
      removeFromCartLocal(productId, variantId)
    }
  }
  
  const removeFromCartLocal = (productId, variantId = null) => {
    setCartItems(prevItems =>
      prevItems.filter(
        item => !(item.product.id === productId && 
        (!variantId || item.variant?.id === variantId))
      )
    )
  }

  // Меняет количество товара в корзине
  const updateQuantity = async (productId, quantity, variantId = null, itemId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId, itemId)
      return
    }

    if (isAuthenticated && user && itemId) {
      // Для авторизованных пользователей обновляем на сервере
      try {
        await cartAPI.updateItem(itemId, quantity)
        // Обновляем локальное состояние
        const response = await cartAPI.getCart()
        const serverCart = response.data.items || []
        setCartItems(serverCart.map(item => ({
          product: item.product,
          variant: item.variant,
          quantity: item.quantity,
          id: item.id
        })))
      } catch (error) {
        console.error('Error updating item quantity on server:', error)
        // При ошибке обновляем локально
        updateQuantityLocal(productId, quantity, variantId)
      }
    } else {
      // Для неавторизованных пользователей только локально
      updateQuantityLocal(productId, quantity, variantId)
    }
  }
  
  const updateQuantityLocal = (productId, quantity, variantId = null) => {
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
  const clearCart = async () => {
    if (isAuthenticated && user) {
      // Для авторизованных пользователей очищаем на сервере
      try {
        await cartAPI.clearCart()
      } catch (error) {
        console.error('Error clearing cart on server:', error)
      }
    }
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
    loading,
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


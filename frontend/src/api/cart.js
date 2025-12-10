/**
 * API для работы с корзиной
 */
import apiClient from './client'

export const cartAPI = {
  // Получить корзину пользователя
  getCart: () => apiClient.get('/shop/cart/'),
  
  // Добавить товар в корзину
  addItem: (productId, variantId = null, quantity = 1) => 
    apiClient.post('/shop/cart/add_item/', {
      product_id: productId,
      variant_id: variantId,
      quantity: quantity
    }),
  
  // Обновить количество товара в корзине
  updateItem: (itemId, quantity) => 
    apiClient.patch(`/shop/cart/items/${itemId}/`, { quantity }),
  
  // Удалить товар из корзины
  removeItem: (itemId) => 
    apiClient.delete(`/shop/cart/items/${itemId}/`),
  
  // Очистить корзину
  clearCart: () => 
    apiClient.delete('/shop/cart/clear/'),
}


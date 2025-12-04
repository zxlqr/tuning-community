import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../api/client'
import VideoBackground from '../../components/VideoBackground/VideoBackground'
import '../../styles/page-background.css'
import './Cart.css'

// Страница корзины с товарами
const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotalPrice } = useCart()
  const { isAuthenticated, user } = useAuth()
  const [deliveryMethod, setDeliveryMethod] = useState('pickup')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [orderId, setOrderId] = useState(null)

  // Мутация для создания заказа
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => apiClient.post('/shop/orders/', orderData),
    onSuccess: (response) => {
      setOrderId(response.data.id)
      setShowCheckout(false)
      setShowPayment(true)
    },
    onError: (error) => {
      console.error('Error creating order:', error)
      alert('Ошибка при оформлении заказа. Попробуйте еще раз.')
    }
  })

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert('Для оформления заказа необходимо войти в систему')
      return
    }

    if (cartItems.length === 0) {
      alert('Корзина пуста')
      return
    }

    setShowCheckout(true)
  }

  const handleSubmitOrder = () => {
    // Валидация обязательных полей
    if (!firstName.trim()) {
      alert('Пожалуйста, введите имя')
      return
    }
    if (!lastName.trim()) {
      alert('Пожалуйста, введите фамилию')
      return
    }
    if (!phone.trim()) {
      alert('Пожалуйста, введите номер телефона')
      return
    }
    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      alert('Пожалуйста, введите адрес доставки')
      return
    }

    const items = cartItems.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity
    }))

    const orderData = {
      delivery_method: deliveryMethod,
      delivery_address: deliveryMethod === 'delivery' ? deliveryAddress : '',
      customer_first_name: firstName.trim(),
      customer_last_name: lastName.trim(),
      customer_middle_name: middleName.trim() || '',
      customer_phone: phone.trim(),
      notes: notes.trim() || '',
      items: items
    }

    createOrderMutation.mutate(orderData)
  }

  const handlePaymentComplete = () => {
    clearCart()
    setShowPayment(false)
    setFirstName('')
    setLastName('')
    setMiddleName('')
    setPhone('')
    setDeliveryAddress('')
    setNotes('')
    setOrderId(null)
  }

  const totalPrice = getTotalPrice()

  return (
    <div className="cart page-background">
      <VideoBackground videoSrc="/videos/1119.mp4" />
      <div className="cart-container">
        <h1 className="cart-title">Корзина</h1>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <p>Ваша корзина пуста</p>
            <Link to="/shop" className="btn-continue-shopping">
              Продолжить покупки
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-content">
              <div className="cart-items">
                {cartItems.map((item, index) => {
                  const itemPrice = item.variant?.final_price || item.product.price
                  const itemTotal = itemPrice * item.quantity

                  return (
                    <div key={`${item.product.id}-${item.variant?.id || 'default'}-${index}`} className="cart-item">
                      <div className="cart-item-image">
                        {item.product.image ? (
                          <img src={item.product.image} alt={item.product.name} />
                        ) : (
                          <div className="cart-item-placeholder">Нет фото</div>
                        )}
                      </div>
                      <div className="cart-item-info">
                        <h3 className="cart-item-name">{item.product.name}</h3>
                        {item.variant && (
                          <p className="cart-item-variant">
                            {item.variant.size && `Размер: ${item.variant.size}`}
                            {item.variant.color && ` • Цвет: ${item.variant.color}`}
                          </p>
                        )}
                        <p className="cart-item-price">{itemPrice} ₽</p>
                      </div>
                      <div className="cart-item-controls">
                        <div className="quantity-controls">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant?.id)}
                            className="quantity-btn"
                          >
                            −
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant?.id)}
                            className="quantity-btn"
                          >
                            +
                          </button>
                        </div>
                        <div className="cart-item-total">{itemTotal} ₽</div>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                          className="remove-btn"
                          title="Удалить"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="cart-summary">
                <div className="summary-card">
                  <h2>Итого</h2>
                  <div className="summary-row">
                    <span>Товаров: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>К оплате:</span>
                    <span className="total-price">{totalPrice} ₽</span>
                  </div>
                  
                  {!showCheckout ? (
                    <button onClick={handleCheckout} className="btn-checkout">
                      Оформить заказ
                    </button>
                  ) : (
                    <div className="checkout-form">
                      <h3 className="checkout-form-title">Данные для заказа</h3>
                      
                      <div className="form-row">
                        <div className="form-group">
                          <label>Имя *</label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="form-input"
                            placeholder="Введите имя"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Фамилия *</label>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="form-input"
                            placeholder="Введите фамилию"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Отчество</label>
                        <input
                          type="text"
                          value={middleName}
                          onChange={(e) => setMiddleName(e.target.value)}
                          className="form-input"
                          placeholder="Введите отчество (необязательно)"
                        />
                      </div>

                      <div className="form-group">
                        <label>Номер телефона *</label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="form-input"
                          placeholder="+7 (999) 123-45-67"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Способ получения:</label>
                        <select
                          value={deliveryMethod}
                          onChange={(e) => setDeliveryMethod(e.target.value)}
                          className="form-input"
                        >
                          <option value="pickup">Самовывоз</option>
                          <option value="delivery">Доставка</option>
                        </select>
                      </div>

                      {deliveryMethod === 'delivery' && (
                        <div className="form-group">
                          <label>Адрес доставки *</label>
                          <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="form-input"
                            rows="3"
                            placeholder="Введите адрес доставки"
                            required
                          />
                        </div>
                      )}

                      <div className="form-group">
                        <label>Комментарий к заказу (необязательно):</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="form-input"
                          rows="3"
                          placeholder="Дополнительная информация"
                        />
                      </div>

                      <div className="checkout-actions">
                        <button
                          onClick={() => setShowCheckout(false)}
                          className="btn-cancel"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={handleSubmitOrder}
                          className="btn-submit-order"
                          disabled={createOrderMutation.isPending}
                        >
                          {createOrderMutation.isPending ? 'Оформление...' : 'Подтвердить заказ'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Cart


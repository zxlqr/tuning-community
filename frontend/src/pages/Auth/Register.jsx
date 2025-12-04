/**
 * Страница регистрации нового пользователя
 * 
 * Позволяет новым пользователям зарегистрироваться в системе.
 * После успешной регистрации автоматически выполняет вход и перенаправляет на профиль.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/page-background.css'
import './Auth.css'

const Register = () => {
  // Состояние формы регистрации
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
  })
  const [error, setError] = useState('')  // Сообщение об ошибке
  const { register } = useAuth()  // Функция регистрации из контекста
  const navigate = useNavigate()  // Для навигации после регистрации

  /**
   * Обработчик изменения полей формы
   * 
   * @param {Event} e - Событие изменения поля
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,  // Обновляем соответствующее поле
    })
  }

  /**
   * Обработчик отправки формы регистрации
   * 
   * @param {Event} e - Событие отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')  // Очищаем предыдущие ошибки
    
    // Проверяем, что пароли совпадают
    if (formData.password !== formData.password_confirm) {
      setError('Пароли не совпадают')
      return
    }
    
    try {
      await register(formData)
      navigate('/profile')  // Перенаправляем на страницу профиля
    } catch (err) {
      // Если регистрация не удалась, показываем ошибку
      console.error('Registration error:', err)
      
      // Обрабатываем разные форматы ошибок от API
      let errorMessage = 'Ошибка регистрации'
      
      if (err.response?.data) {
        const errorData = err.response.data
        
        // Если ошибка в формате {field: ['error message']}
        if (typeof errorData === 'object') {
          const errors = []
          for (const [key, value] of Object.entries(errorData)) {
            if (Array.isArray(value)) {
              errors.push(...value)
            } else if (typeof value === 'string') {
              errors.push(value)
            } else {
              errors.push(`${key}: ${JSON.stringify(value)}`)
            }
          }
          errorMessage = errors.length > 0 ? errors.join(', ') : errorMessage
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else if (errorData.message) {
          errorMessage = errorData.message
        }
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    }
  }

  return (
    <div className="auth-container page-background">
      <div className="auth-card">
        <h2>Регистрация</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Имя</label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Фамилия</label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Телефон</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Подтвердите пароль</label>
            <input
              type="password"
              name="password_confirm"
              value={formData.password_confirm}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Зарегистрироваться</button>
        </form>
        <p>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}

export default Register


/**
 * Страница входа в систему
 * 
 * Позволяет пользователю войти в систему, используя имя пользователя и пароль.
 * После успешного входа перенаправляет на страницу профиля.
 */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/page-background.css'
import './Auth.css'

const Login = () => {
  const [username, setUsername] = useState('')  // Имя пользователя
  const [password, setPassword] = useState('')  // Пароль
  const [error, setError] = useState('')  // Сообщение об ошибке
  const { login } = useAuth()  // Функция входа из контекста
  const navigate = useNavigate()  // Для навигации после входа

  /**
   * Обработчик отправки формы входа
   * 
   * @param {Event} e - Событие отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')  // Очищаем предыдущие ошибки
    
    try {
      // Передаем объект с username и password
      await login(username, password)
      navigate('/profile')  // Перенаправляем на страницу профиля
    } catch (err) {
      // Если вход не удался, показываем сообщение об ошибке
      console.error('Login error:', err)
      
      // Пытаемся извлечь детальное сообщение об ошибке
      let errorMessage = 'Неверное имя пользователя или пароль'
      if (err.response?.data) {
        const errorData = err.response.data
        // Проверяем различные форматы ошибок
        if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors) 
            ? errorData.non_field_errors[0] 
            : errorData.non_field_errors
        } else if (errorData.username) {
          errorMessage = Array.isArray(errorData.username) 
            ? errorData.username[0] 
            : errorData.username
        } else if (errorData.password) {
          errorMessage = Array.isArray(errorData.password) 
            ? errorData.password[0] 
            : errorData.password
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        } else if (errorData.detail) {
          errorMessage = errorData.detail
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
        <h2>Вход</h2>
        {/* Показываем ошибку, если она есть */}
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Войти</button>
        </form>
        <p>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  )
}

export default Login


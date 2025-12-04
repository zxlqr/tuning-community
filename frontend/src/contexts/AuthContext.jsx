/**
 * Контекст аутентификации
 * 
 * Управляет состоянием текущего пользователя и методами аутентификации.
 * Предоставляет информацию о пользователе всем компонентам приложения.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/auth'

// Создаем контекст для аутентификации
const AuthContext = createContext()

/**
 * Хук для использования контекста аутентификации
 * 
 * @returns {Object} Объект с информацией о пользователе и методами аутентификации
 * @throws {Error} Если используется вне AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

/**
 * Провайдер аутентификации
 * 
 * Обертка для компонентов приложения, предоставляющая контекст аутентификации.
 * Автоматически проверяет текущего пользователя при загрузке приложения.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)  // Текущий пользователь
  const [loading, setLoading] = useState(true)  // Флаг загрузки

  useEffect(() => {
    /**
     * При загрузке приложения проверяем, авторизован ли пользователь
     * Если да - загружаем информацию о нем
     */
    authAPI.me()
      .then(response => {
        setUser(response.data)
      })
      .catch(() => {
        // Если пользователь не авторизован, устанавливаем null
        setUser(null)
      })
      .finally(() => {
        setLoading(false)  // Завершаем загрузку
      })
  }, [])

  /**
   * Вход пользователя в систему
   * 
   * @param {string} username - Имя пользователя
   * @param {string} password - Пароль
   * @returns {Promise<Object>} Данные пользователя
   * @throws {Error} Если вход не удался
   */
  const login = async (username, password) => {
    try {
      const response = await authAPI.login({ username, password })
      setUser(response.data)  // Сохраняем данные пользователя
      return response.data
    } catch (error) {
      // Пробрасываем ошибку дальше, чтобы компонент мог её обработать
      console.error('Login error in AuthContext:', error)
      throw error
    }
  }

  /**
   * Регистрация нового пользователя
   * 
   * @param {Object} data - Данные для регистрации
   * @returns {Promise<Object>} Данные зарегистрированного пользователя
   * @throws {Error} Если регистрация не удалась
   */
  const register = async (data) => {
    try {
      const response = await authAPI.register(data)
      setUser(response.data)  // Сохраняем данные пользователя
      return response.data
    } catch (error) {
      // Пробрасываем ошибку дальше, чтобы компонент мог её обработать
      console.error('Registration error in AuthContext:', error)
      throw error
    }
  }

  /**
   * Выход пользователя из системы
   */
  const logout = async () => {
    await authAPI.logout()
    setUser(null)  // Очищаем данные пользователя
  }

  /**
   * Обновление данных пользователя
   */
  const refreshUser = async () => {
    try {
      const response = await authAPI.me()
      setUser(response.data)
      return response.data
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
    }
  }

  // Значение контекста, доступное всем дочерним компонентам
  const value = {
    user,  // Текущий пользователь
    loading,  // Флаг загрузки
    login,  // Функция входа
    register,  // Функция регистрации
    logout,  // Функция выхода
    refreshUser,  // Функция обновления данных пользователя
    isAuthenticated: !!user,  // Авторизован ли пользователь
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


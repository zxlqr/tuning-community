/**
 * API методы для аутентификации
 * 
 * Предоставляет методы для регистрации, входа, выхода и получения
 * информации о текущем пользователе.
 */
import apiClient from './client'

export const authAPI = {
  /**
   * Регистрация нового пользователя
   * 
   * @param {Object} data - Данные пользователя (username, email, password, etc.)
   * @returns {Promise} Ответ сервера с данными пользователя
   */
  register: (data) => apiClient.post('/auth/register/', data),
  
  /**
   * Вход пользователя в систему
   * 
   * @param {Object} data - Учетные данные (username, password)
   * @returns {Promise} Ответ сервера с данными пользователя
   */
  login: (data) => apiClient.post('/auth/login/', data),
  
  /**
   * Выход пользователя из системы
   * 
   * @returns {Promise} Ответ сервера
   */
  logout: () => apiClient.post('/auth/logout/'),
  
  /**
   * Получение информации о текущем пользователе
   * 
   * @returns {Promise} Ответ сервера с данными пользователя
   */
  me: () => apiClient.get('/auth/me/'),
}


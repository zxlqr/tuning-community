/**
 * API клиент для работы с backend
 * 
 * Настроен для работы с Django REST Framework через сессионную аутентификацию.
 * Автоматически добавляет CSRF токен к запросам, которые его требуют.
 */
import axios from 'axios'

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL: '/api',  // Базовый URL для всех API запросов
  withCredentials: true,  // Включаем отправку cookies для сессионной аутентификации
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Получение CSRF токена с сервера
 * 
 * Django требует CSRF токен для всех POST/PUT/PATCH/DELETE запросов.
 * Токен может быть получен из cookies или напрямую с сервера.
 * 
 * @returns {Promise<string|null>} CSRF токен или null в случае ошибки
 */
const getCsrfToken = async () => {
  try {
    const response = await axios.get('/api/csrf-token/', {
      withCredentials: true,
    })
    return response.data.csrftoken
  } catch (error) {
    console.error('Failed to get CSRF token:', error)
    return null
  }
}

/**
 * Интерсептор запросов для автоматического добавления CSRF токена
 * 
 * Для всех изменяющих запросов (POST, PUT, PATCH, DELETE) автоматически
 * добавляет CSRF токен в заголовки запроса.
 */
apiClient.interceptors.request.use(
  async (config) => {
    // Для FormData не устанавливаем Content-Type - браузер сделает это автоматически
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    // Для методов, которые требуют CSRF токен
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      // Сначала пытаемся получить токен из cookies
      let csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1]
      
      // Если токен не найден в cookies, получаем его с сервера
      if (!csrfToken) {
        csrfToken = await getCsrfToken()
      }
      
      // Добавляем токен в заголовки запроса
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient


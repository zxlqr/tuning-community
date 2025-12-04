/**
 * API методы для работы с форумом
 * 
 * Предоставляет методы для работы с категориями, темами и сообщениями форума.
 */
import apiClient from './client'

export const forumAPI = {
  /**
   * Получить список всех категорий форума
   * 
   * @returns {Promise} Ответ сервера со списком категорий
   */
  getCategories: () => apiClient.get('/forum/categories/').then(res => res.data),
  
  /**
   * Получить список тем форума
   * 
   * @param {Object} params - Параметры фильтрации (category, author, is_pinned, is_locked, category_slug)
   * @returns {Promise} Ответ сервера со списком тем
   */
  getTopics: (params = {}) => apiClient.get('/forum/topics/', { params }).then(res => res.data),
  
  /**
   * Получить детальную информацию о теме
   * 
   * @param {number} topicId - ID темы
   * @returns {Promise} Ответ сервера с данными темы и сообщениями
   */
  getTopic: (topicId) => apiClient.get(`/forum/topics/${topicId}/`).then(res => res.data),
  
  /**
   * Создать новую тему
   * 
   * @param {Object} data - Данные темы (title, content, category)
   * @returns {Promise} Ответ сервера с созданной темой
   */
  createTopic: (data) => apiClient.post('/forum/topics/', data),
  
  /**
   * Обновить тему
   * 
   * @param {number} topicId - ID темы
   * @param {Object} data - Обновленные данные темы
   * @returns {Promise} Ответ сервера с обновленной темой
   */
  updateTopic: (topicId, data) => apiClient.patch(`/forum/topics/${topicId}/`, data),
  
  /**
   * Удалить тему
   * 
   * @param {number} topicId - ID темы
   * @returns {Promise} Ответ сервера
   */
  deleteTopic: (topicId) => apiClient.delete(`/forum/topics/${topicId}/`),
  
  /**
   * Закрепить/открепить тему (только для менеджеров и админов)
   * 
   * @param {number} topicId - ID темы
   * @returns {Promise} Ответ сервера с обновленным статусом
   */
  togglePin: (topicId) => apiClient.post(`/forum/topics/${topicId}/toggle_pin/`),
  
  /**
   * Закрыть/открыть тему (только для менеджеров и админов)
   * 
   * @param {number} topicId - ID темы
   * @returns {Promise} Ответ сервера с обновленным статусом
   */
  toggleLock: (topicId) => apiClient.post(`/forum/topics/${topicId}/toggle_lock/`),
  
  /**
   * Получить список сообщений в теме
   * 
   * @param {Object} params - Параметры фильтрации (topic, author)
   * @returns {Promise} Ответ сервера со списком сообщений
   */
  getPosts: (params = {}) => apiClient.get('/forum/posts/', { params }).then(res => res.data),
  
  /**
   * Создать новое сообщение в теме
   * 
   * @param {Object} data - Данные сообщения (topic, content)
   * @returns {Promise} Ответ сервера с созданным сообщением
   */
  createPost: (data) => apiClient.post('/forum/posts/', data),
  
  /**
   * Обновить сообщение
   * 
   * @param {number} postId - ID сообщения
   * @param {Object} data - Обновленные данные сообщения
   * @returns {Promise} Ответ сервера с обновленным сообщением
   */
  updatePost: (postId, data) => apiClient.patch(`/forum/posts/${postId}/`, data),
  
  /**
   * Удалить сообщение
   * 
   * @param {number} postId - ID сообщения
   * @returns {Promise} Ответ сервера
   */
  deletePost: (postId) => apiClient.delete(`/forum/posts/${postId}/`),
  
  /**
   * Поставить/убрать лайк к сообщению
   * 
   * @param {number} postId - ID сообщения
   * @returns {Promise} Ответ сервера с информацией о лайке
   */
  toggleLike: (postId) => apiClient.post(`/forum/posts/${postId}/like/`),
  
  /**
   * Получить список пользователей, поставивших лайк сообщению
   * 
   * @param {number} postId - ID сообщения
   * @returns {Promise} Ответ сервера со списком лайков
   */
  getPostLikes: (postId) => apiClient.get(`/forum/posts/${postId}/likes/`).then(res => res.data),
  
  /**
   * Загрузить изображение для темы
   * 
   * @param {number} topicId - ID темы
   * @param {File} imageFile - Файл изображения
   * @returns {Promise} Ответ сервера с загруженным изображением
   */
  uploadTopicImage: (topicId, imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('topic', String(topicId)) // Явно преобразуем в строку
    console.log('=== ОТПРАВКА ИЗОБРАЖЕНИЯ ===')
    console.log('Topic ID:', topicId, 'Type:', typeof topicId)
    console.log('Image file:', imageFile.name, 'Size:', imageFile.size)
    // Не устанавливаем Content-Type - интерсептор в client.js сделает это автоматически
    return apiClient.post('/forum/images/', formData).then(res => {
      console.log('=== ИЗОБРАЖЕНИЕ ЗАГРУЖЕНО ===')
      console.log('Ответ сервера:', res.data)
      return res.data
    })
  },
  
  /**
   * Загрузить изображение для поста
   * 
   * @param {number} postId - ID поста
   * @param {File} imageFile - Файл изображения
   * @returns {Promise} Ответ сервера с загруженным изображением
   */
  uploadPostImage: (postId, imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    formData.append('post', postId)
    // Не устанавливаем Content-Type - интерсептор в client.js сделает это автоматически
    return apiClient.post('/forum/images/', formData).then(res => res.data)
  },
  
  /**
   * Удалить изображение
   * 
   * @param {number} imageId - ID изображения
   * @returns {Promise} Ответ сервера
   */
  deleteImage: (imageId) => apiClient.delete(`/forum/images/${imageId}/`),
}


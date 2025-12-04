/**
 * API функции для работы с автомобилями и их фото
 */
import apiClient from './client'

/**
 * Получить список всех автомобилей текущего пользователя
 */
export const getCars = () => {
  return apiClient.get('/auth/cars/').then(res => {
    const data = res.data
    // Обрабатываем разные форматы ответа
    if (Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.results)) {
      return data.results
    }
    return []
  })
}

/**
 * Получить информацию об одном автомобиле
 */
export const getCar = (carId) => {
  return apiClient.get(`/auth/cars/${carId}/`).then(res => res.data)
}

/**
 * Создать новый автомобиль
 */
export const createCar = (data) => {
  // Если есть фото, используем FormData
  if (data.photo) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'photo') {
        formData.append('photo', data.photo)
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key])
      }
    })
    return apiClient.post('/auth/cars/', formData)
  } else {
    return apiClient.post('/auth/cars/', data)
  }
}

/**
 * Обновить информацию об автомобиле
 */
export const updateCar = (carId, data) => {
  // Если есть фото, используем FormData
  if (data.photo) {
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (key === 'photo') {
        formData.append('photo', data.photo)
      } else if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key])
      }
    })
    return apiClient.patch(`/auth/cars/${carId}/`, formData)
  } else {
    return apiClient.patch(`/auth/cars/${carId}/`, data)
  }
}

/**
 * Удалить автомобиль
 */
export const deleteCar = (carId) => {
  return apiClient.delete(`/auth/cars/${carId}/`)
}

/**
 * Получить все фото автомобиля
 */
export const getCarPhotos = (carId) => {
  return apiClient.get(`/auth/car-photos/?car_id=${carId}`).then(res => {
    const data = res.data
    if (Array.isArray(data)) {
      return data
    } else if (data && Array.isArray(data.results)) {
      return data.results
    }
    return []
  })
}

/**
 * Добавить фото к автомобилю
 */
export const addCarPhoto = (carId, photoFile, isPrimary = false) => {
  const formData = new FormData()
  formData.append('photo', photoFile)
  formData.append('car', carId)
  if (isPrimary) {
    formData.append('is_primary', 'true')
  }
  return apiClient.post('/auth/car-photos/', formData)
}

/**
 * Удалить фото автомобиля
 */
export const deleteCarPhoto = (photoId) => {
  return apiClient.delete(`/auth/car-photos/${photoId}/`)
}

/**
 * Установить фото как основное
 */
export const setPrimaryPhoto = (photoId) => {
  return apiClient.patch(`/auth/car-photos/${photoId}/`, { is_primary: true })
}


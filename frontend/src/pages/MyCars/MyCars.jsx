/**
 * Страница "Мои автомобили"
 * 
 * Отображает список всех автомобилей текущего пользователя.
 * Позволяет добавлять новые автомобили и просматривать информацию о существующих.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '../../api/client'
import CarGallery from '../../components/CarGallery/CarGallery'
import CarEditModal from '../../components/CarEditModal/CarEditModal'
import './MyCars.css'

const MyCars = () => {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    generation: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
    color: '',
    photo: null,
  })
  const [photoPreview, setPhotoPreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [selectedCar, setSelectedCar] = useState(null)
  const [showGallery, setShowGallery] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Загружаем список автомобилей текущего пользователя
  const { data: carsData, isLoading } = useQuery({
    queryKey: ['cars'],  // Ключ для кэширования данных
    queryFn: async () => {
      const res = await apiClient.get('/auth/cars/')
      // DRF может возвращать массив или объект с results (при пагинации)
      // Обрабатываем оба случая
      const data = res.data
      if (Array.isArray(data)) {
        return data
      } else if (data && Array.isArray(data.results)) {
        return data.results
      } else {
        console.error('Неожиданный формат данных:', data)
        return []
      }
    },
  })
  
  // Извлекаем массив автомобилей из данных
  const cars = Array.isArray(carsData) ? carsData : []

  // Мутация для создания нового автомобиля
  const createCarMutation = useMutation({
    mutationFn: (data) => {
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
        // Для FormData не нужно указывать Content-Type - axios сделает это автоматически
        return apiClient.post('/auth/cars/', formData)
      } else {
        // Обычная отправка JSON
        return apiClient.post('/auth/cars/', data)
      }
    },
    onSuccess: () => {
      // Обновляем список автомобилей после успешного создания
      queryClient.invalidateQueries(['cars'])
      // Очищаем форму и скрываем её
      setFormData({
        brand: '',
        model: '',
        generation: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        color: '',
        photo: null,
      })
      setPhotoPreview(null)
      setErrors({})
      setShowAddForm(false)
      alert('Автомобиль успешно добавлен!')
    },
    onError: (error) => {
      // Обрабатываем ошибки валидации
      console.error('Ошибка при добавлении автомобиля:', error)
      if (error.response?.data) {
        const errorData = error.response.data
        // Обрабатываем различные форматы ошибок
        const newErrors = {}
        for (const [key, value] of Object.entries(errorData)) {
          if (Array.isArray(value)) {
            newErrors[key] = value[0]
          } else if (typeof value === 'string') {
            newErrors[key] = value
          } else {
            newErrors[key] = JSON.stringify(value)
          }
        }
        setErrors(newErrors)
      } else if (error.message) {
        setErrors({ general: error.message })
      } else {
        setErrors({ general: 'Ошибка при добавлении автомобиля. Проверьте консоль браузера.' })
      }
    },
  })

  /**
   * Обработчик изменения полей формы
   */
  const handleChange = (e) => {
    const { name, value, files } = e.target
    
    // Обработка загрузки фото
    if (name === 'photo' && files && files[0]) {
      const file = files[0]
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Выберите изображение' }))
        return
      }
      // Проверяем размер файла (максимум 10 МБ)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, photo: 'Размер файла не должен превышать 10 МБ' }))
        return
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: file
      }))
      
      // Создаем предпросмотр
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Очищаем ошибку для этого поля при изменении
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  /**
   * Обработчик отправки формы
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    // Валидация обязательных полей
    if (!formData.brand || !formData.model) {
      setErrors({ general: 'Заполните все обязательные поля (марка и модель)' })
      return
    }

    // Проверяем год
    if (!formData.year || isNaN(parseInt(formData.year))) {
      setErrors({ general: 'Укажите корректный год выпуска' })
      return
    }

    // Подготавливаем данные для отправки (убираем пустые поля)
    const submitData = {
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      year: parseInt(formData.year),
    }

    // Добавляем необязательные поля, если они заполнены
    if (formData.license_plate?.trim()) {
      submitData.license_plate = formData.license_plate.trim()
    }
    if (formData.generation?.trim()) {
      submitData.generation = formData.generation.trim()
    }
    if (formData.vin?.trim()) {
      submitData.vin = formData.vin.trim()
    }
    if (formData.color?.trim()) {
      submitData.color = formData.color.trim()
    }
    // Добавляем фото, если оно было выбрано
    if (formData.photo) {
      submitData.photo = formData.photo
    }

    console.log('Отправка данных автомобиля:', submitData)
    createCarMutation.mutate(submitData)
  }

  // Показываем индикатор загрузки, пока данные не загружены
  if (isLoading) {
    return (
      <div className="my-cars">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка автомобилей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-cars">
      <div className="my-cars-header">
        <h1>Мои автомобили</h1>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-add-car"
        >
          {showAddForm ? 'Отмена' : '+ Добавить автомобиль'}
        </button>
      </div>

      {/* Форма добавления автомобиля */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="add-car-form">
          <h2>Добавить новый автомобиль</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="brand">Марка *</label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="Например: Toyota"
                className={errors.brand ? 'error' : ''}
                required
              />
              {errors.brand && <span className="error-message">{errors.brand}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="model">Модель *</label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Например: Mark II"
                className={errors.model ? 'error' : ''}
                required
              />
              {errors.model && <span className="error-message">{errors.model}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="generation">Поколение/Кузов</label>
              <input
                type="text"
                id="generation"
                name="generation"
                value={formData.generation}
                onChange={handleChange}
                placeholder="Например: JZX90, E46, W210"
                className={errors.generation ? 'error' : ''}
              />
              {errors.generation && <span className="error-message">{errors.generation}</span>}
              <small>Необязательное поле. Указывается для уточнения поколения или кузова. Можно вводить в любом регистре (jzx90 → JZX90).</small>
            </div>

            <div className="form-group">
              <label htmlFor="year">Год выпуска *</label>
              <input
                type="number"
                id="year"
                name="year"
                value={formData.year}
                onChange={handleChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={errors.year ? 'error' : ''}
                required
              />
              {errors.year && <span className="error-message">{errors.year}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="license_plate">Госномер</label>
              <input
                type="text"
                id="license_plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="Например: А123БВ777"
                className={errors.license_plate ? 'error' : ''}
              />
              {errors.license_plate && <span className="error-message">{errors.license_plate}</span>}
              <small>Необязательное поле</small>
            </div>

            <div className="form-group">
              <label htmlFor="vin">VIN-код</label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                placeholder="17 символов"
                maxLength="17"
                className={errors.vin ? 'error' : ''}
              />
              {errors.vin && <span className="error-message">{errors.vin}</span>}
              <small>Необязательное поле</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="color">Цвет</label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="Например: Черный"
              className={errors.color ? 'error' : ''}
            />
            {errors.color && <span className="error-message">{errors.color}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="photo">Фото автомобиля</label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handleChange}
              className={errors.photo ? 'error' : ''}
            />
            {errors.photo && <span className="error-message">{errors.photo}</span>}
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Предпросмотр" />
                <p>Предпросмотр (фото будет автоматически обрезано)</p>
              </div>
            )}
            <small>Максимальный размер: 10 МБ. Фото будет автоматически обрезано до прямоугольного формата.</small>
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          <div className="form-actions">
            <button type="submit" disabled={createCarMutation.isLoading}>
              {createCarMutation.isLoading ? 'Добавление...' : 'Добавить автомобиль'}
            </button>
          </div>
        </form>
      )}

      {/* Список автомобилей */}
      {cars?.length === 0 ? (
        <div className="no-cars">
          <p>У вас пока нет автомобилей</p>
          <p>Добавьте свой первый автомобиль, чтобы начать бронировать услуги</p>
        </div>
      ) : (
        <div 
          className="cars-list"
          style={{
            gridTemplateColumns: cars.length === 1 ? '1fr' : cars.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            maxWidth: cars.length === 1 ? '400px' : cars.length === 2 ? '800px' : '1200px'
          }}
        >
          {/* Отображаем каждый автомобиль в виде карточки */}
          {Array.isArray(cars) && cars.length > 0 && cars.map(car => (
            <div key={car.id} className="car-card">
              <div 
                className="car-card-header"
                onClick={() => {
                  setSelectedCar(car)
                  setShowGallery(true)
                }}
                style={{ cursor: 'pointer' }}
              >
                {car.primary_photo_url || car.photo_url ? (
                  <div className="car-photo">
                    <img src={car.primary_photo_url || car.photo_url} alt={`${car.brand} ${car.model}`} />
                    {car.photos && car.photos.length > 0 && (
                      <div className="photo-count-badge">
                        <i className="fa fa-camera" aria-hidden="true"></i>
                        {car.photos.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="car-photo-placeholder">
                    <i className="fa fa-car" aria-hidden="true"></i>
                  </div>
                )}
                <div className="car-badge">
                  <span className="car-year">{car.year}</span>
                </div>
              </div>
              <div className="car-info">
                <h3 className="car-title">
                  {car.brand} {car.model}
                  {car.generation && <span className="generation"> {car.generation}</span>}
                </h3>
                <div className="car-details">
                  {car.license_plate && (
                    <div className="car-detail-item">
                      <i className="fa fa-id-card" aria-hidden="true"></i>
                      <div>
                        <span className="detail-label">Госномер</span>
                        <span className="detail-value">{car.license_plate}</span>
                      </div>
                    </div>
                  )}
                  {car.color && (
                    <div className="car-detail-item">
                      <i className="fa fa-paint-brush" aria-hidden="true"></i>
                      <div>
                        <span className="detail-label">Цвет</span>
                        <span className="detail-value">{car.color}</span>
                      </div>
                    </div>
                  )}
                  {car.vin && (
                    <div className="car-detail-item">
                      <i className="fa fa-barcode" aria-hidden="true"></i>
                      <div>
                        <span className="detail-label">VIN</span>
                        <span className="detail-value">{car.vin}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="car-actions">
                  <button
                    className="btn-edit"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCar(car)
                      setShowEditModal(true)
                    }}
                  >
                    <i className="fa fa-edit" aria-hidden="true"></i>
                    Редактировать
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Галерея фото */}
      {showGallery && selectedCar && (
        <CarGallery
          car={selectedCar}
          onClose={() => {
            setShowGallery(false)
            setSelectedCar(null)
          }}
        />
      )}

      {/* Модальное окно редактирования */}
      {showEditModal && selectedCar && (
        <CarEditModal
          car={selectedCar}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCar(null)
          }}
        />
      )}
    </div>
  )
}

export default MyCars


// Страница личного кабинета пользователя
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import apiClient from '../../api/client'
import CarGallery from '../../components/CarGallery/CarGallery'
import CarEditModal from '../../components/CarEditModal/CarEditModal'
import '../../styles/page-background.css'
import './Profile.css'

const Profile = () => {
  const { userId } = useParams() // Получаем userId из URL, если есть
  const { user, refreshUser } = useAuth()
  const { showNotification } = useNotification()
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [showAddCarForm, setShowAddCarForm] = useState(false)
  
  // Определяем, просматриваем ли мы свой профиль или чужой
  const isOwnProfile = !userId || (user && userId === String(user.id))
  const [carFormData, setCarFormData] = useState({
    brand: '',
    model: '',
    generation: '',
    year: new Date().getFullYear(),
    license_plate: '',
    vin: '',
    color: '',
    photo: null,
  })
  const [carPhotoPreview, setCarPhotoPreview] = useState(null)
  const [carErrors, setCarErrors] = useState({})
  const [selectedCar, setSelectedCar] = useState(null)
  const [showGallery, setShowGallery] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isEditingSocial, setIsEditingSocial] = useState(false)
  const [bioText, setBioText] = useState('')
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    telegram: '',
    youtube: '',
    vk: ''
  })
  
  // Состояние для отслеживания изменений
  const [hasBioChanges, setHasBioChanges] = useState(false)
  const [hasSocialChanges, setHasSocialChanges] = useState(false)

  // Загружаем данные пользователя
  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (isOwnProfile && user) {
        // Свой профиль - используем /auth/me/
        const res = await apiClient.get('/auth/me/')
        return res.data
      } else if (userId) {
        // Чужой профиль - используем /accounts/users/{id}/
        const res = await apiClient.get(`/accounts/users/${userId}/`)
        return res.data
      }
      return null
    },
    enabled: !!user || !!userId,
  })

  // Загружаем список автомобилей (только для своего профиля)
  const { data: carsData, isLoading: isLoadingCars } = useQuery({
    queryKey: ['cars', userId],
    queryFn: async () => {
      if (isOwnProfile) {
        const res = await apiClient.get('/auth/cars/')
        const data = res.data
        if (Array.isArray(data)) {
          return data
        } else if (data && Array.isArray(data.results)) {
          return data.results
        }
      } else if (userId && userData) {
        // Для чужого профиля берем автомобили из данных пользователя
        return userData.cars || []
      }
      return []
    },
    enabled: isOwnProfile || !!userData,
  })

  const cars = Array.isArray(carsData) ? carsData : []
  const currentUser = userData || user

  // Мутация для обновления аватарки
  const updateAvatarMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return apiClient.patch('/auth/update_profile/', formData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile'])
      refreshUser()
      setAvatarPreview(null)
    },
    onError: (error) => {
      console.error('Ошибка при загрузке аватарки:', error)
      showNotification('Ошибка при загрузке аватарки', 'error')
    },
  })

  // Мутация для создания автомобиля
  const createCarMutation = useMutation({
    mutationFn: (data) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cars'])
      setCarFormData({
        brand: '',
        model: '',
        generation: '',
        year: new Date().getFullYear(),
        license_plate: '',
        vin: '',
        color: '',
        photo: null,
      })
      setCarPhotoPreview(null)
      setCarErrors({})
      setShowAddCarForm(false)
      showNotification('Автомобиль успешно добавлен!', 'success')
    },
    onError: (error) => {
      console.error('Ошибка при добавлении автомобиля:', error)
      if (error.response?.data) {
        const errorData = error.response.data
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
        setCarErrors(newErrors)
      } else if (error.message) {
        setCarErrors({ general: error.message })
      } else {
        setCarErrors({ general: 'Ошибка при добавлении автомобиля' })
      }
    },
  })

  // Обработчик выбора аватарки
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showNotification('Выберите изображение', 'warning')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Размер файла не должен превышать 5 МБ', 'warning')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result)
    }
    reader.readAsDataURL(file)

    updateAvatarMutation.mutate(file)
  }

  // Обработчик изменения полей формы автомобиля
  const handleCarChange = (e) => {
    const { name, value, files } = e.target

    if (name === 'photo' && files && files[0]) {
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        setCarErrors(prev => ({ ...prev, photo: 'Выберите изображение' }))
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setCarErrors(prev => ({ ...prev, photo: 'Размер файла не должен превышать 10 МБ' }))
        return
      }

      setCarFormData(prev => ({
        ...prev,
        [name]: file
      }))

      const reader = new FileReader()
      reader.onloadend = () => {
        setCarPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setCarFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }

    if (carErrors[name]) {
      setCarErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Обработчик отправки формы автомобиля
  const handleCarSubmit = async (e) => {
    e.preventDefault()
    setCarErrors({})

    if (!carFormData.brand || !carFormData.model) {
      setCarErrors({ general: 'Заполните все обязательные поля (марка и модель)' })
      return
    }

    if (!carFormData.year || isNaN(parseInt(carFormData.year))) {
      setCarErrors({ general: 'Укажите корректный год выпуска' })
      return
    }

    const submitData = {
      brand: carFormData.brand.trim(),
      model: carFormData.model.trim(),
      year: parseInt(carFormData.year),
    }

    if (carFormData.license_plate?.trim()) {
      submitData.license_plate = carFormData.license_plate.trim()
    }
    if (carFormData.generation?.trim()) {
      submitData.generation = carFormData.generation.trim()
    }
    if (carFormData.vin?.trim()) {
      submitData.vin = carFormData.vin.trim()
    }
    if (carFormData.color?.trim()) {
      submitData.color = carFormData.color.trim()
    }
    if (carFormData.photo) {
      submitData.photo = carFormData.photo
    }

    createCarMutation.mutate(submitData)
  }

  // Мутация для обновления настроек приватности
  const updatePrivacyMutation = useMutation({
    mutationFn: async (privacyData) => {
      return apiClient.patch('/auth/update_profile/', privacyData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile'])
      refreshUser()
    },
    onError: (error) => {
      console.error('Ошибка при обновлении настроек приватности:', error)
      showNotification('Ошибка при обновлении настроек приватности', 'error')
    },
  })

  // Обработчик изменения настроек приватности
  const handlePrivacyChange = (field, value) => {
    updatePrivacyMutation.mutate({
      [field]: value
    })
  }

  // Инициализация полей bio и соцсетей при загрузке данных
  useEffect(() => {
    if (currentUser && !isEditingBio && !isEditingSocial) {
      const bio = currentUser.bio || ''
      const instagram = currentUser.instagram || ''
      const telegram = currentUser.telegram || ''
      const youtube = currentUser.youtube || ''
      const vk = currentUser.vk || ''
      
      setBioText(bio)
      setSocialLinks({ instagram, telegram, youtube, vk })
      setHasBioChanges(false)
      setHasSocialChanges(false)
    }
  }, [currentUser?.id, currentUser?.bio, currentUser?.instagram, currentUser?.telegram, currentUser?.youtube, currentUser?.vk, isEditingBio, isEditingSocial])

  // Мутация для обновления bio и соцсетей
  const updateBioAndSocialMutation = useMutation({
    mutationFn: async (data) => {
      return apiClient.patch('/auth/update_profile/', data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile'])
      refreshUser()
      setIsEditingBio(false)
      setIsEditingSocial(false)
      showNotification('Профиль обновлен', 'success')
    },
    onError: (error) => {
      console.error('Ошибка при обновлении профиля:', error)
      showNotification('Ошибка при обновлении профиля', 'error')
    },
  })

  const handleSaveBio = async () => {
    if (updateBioAndSocialMutation.isPending) return
    
    try {
      await updateBioAndSocialMutation.mutateAsync({ 
        bio: bioText.trim() || '' 
      })
      setIsEditingBio(false)
      setHasBioChanges(false)
    } catch (error) {
      console.error('Ошибка при сохранении описания:', error)
    }
  }

  const handleSaveSocial = async () => {
    if (updateBioAndSocialMutation.isPending) return
    
    try {
      const data = {
        instagram: (socialLinks.instagram || '').trim(),
        telegram: (socialLinks.telegram || '').trim(),
        youtube: (socialLinks.youtube || '').trim(),
        vk: (socialLinks.vk || '').trim()
      }
      
      await updateBioAndSocialMutation.mutateAsync(data)
      setIsEditingSocial(false)
      setHasSocialChanges(false)
    } catch (error) {
      console.error('Ошибка при сохранении соцсетей:', error)
    }
  }
  
  const handleBioChange = (value) => {
    setBioText(value)
    setHasBioChanges(value.trim() !== (currentUser?.bio || '').trim())
  }
  
  const handleSocialChange = (field, value) => {
    const newLinks = { ...socialLinks, [field]: value }
    setSocialLinks(newLinks)
    
    const original = {
      instagram: currentUser?.instagram || '',
      telegram: currentUser?.telegram || '',
      youtube: currentUser?.youtube || '',
      vk: currentUser?.vk || ''
    }
    
    const hasChanges = Object.keys(newLinks).some(
      key => (newLinks[key] || '').trim() !== (original[key] || '').trim()
    )
    setHasSocialChanges(hasChanges)
  }
  
  const handleCancelBio = () => {
    setBioText(currentUser?.bio || '')
    setIsEditingBio(false)
    setHasBioChanges(false)
  }
  
  const handleCancelSocial = () => {
    setSocialLinks({
      instagram: currentUser?.instagram || '',
      telegram: currentUser?.telegram || '',
      youtube: currentUser?.youtube || '',
      vk: currentUser?.vk || ''
    })
    setIsEditingSocial(false)
    setHasSocialChanges(false)
  }

  if (isLoadingUser) {
    return <div className="profile-loading">Загрузка...</div>
  }

  if (!userData && !isOwnProfile) {
    return <div className="profile-loading">Пользователь не найден</div>
  }

  const avatarUrl = currentUser?.avatar_url || avatarPreview

  return (
    <div className="profile page-background">
      <h1>ЛИЧНЫЙ КАБИНЕТ</h1>
      
      {/* Блок профиля с аватаркой */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-container">
            <div 
              className="avatar-wrapper"
              onClick={() => isOwnProfile && fileInputRef.current?.click()}
              style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Аватар" 
                  className="avatar-image"
                />
              ) : (
                <div className="avatar-placeholder">
                  <span>{currentUser?.username?.[0]?.toUpperCase() || 'U'}</span>
                </div>
              )}
              {isOwnProfile && (
                <div className="avatar-overlay">
                  <span>Изменить</span>
                </div>
              )}
            </div>
            {isOwnProfile && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                {updateAvatarMutation.isLoading && (
                  <div className="avatar-loading">Загрузка...</div>
                )}
              </>
            )}
          </div>
          <div className="profile-info-header">
            <h2>Информация о пользователе</h2>
            <p className="profile-username">@{currentUser?.username}</p>
          </div>
        </div>

        <div className="profile-info">
          <p><strong>Имя пользователя:</strong> {currentUser?.username}</p>
          <p>
            <strong>Email:</strong> {currentUser?.email || 'Не указано'}
            {isOwnProfile && (
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={currentUser?.is_email_private || false}
                  onChange={(e) => handlePrivacyChange('is_email_private', e.target.checked)}
                />
                <span>Скрыть от других</span>
              </label>
            )}
          </p>
          <p>
            <strong>Имя:</strong> {currentUser?.first_name || 'Не указано'}
            {isOwnProfile && (
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={currentUser?.is_first_name_private || false}
                  onChange={(e) => handlePrivacyChange('is_first_name_private', e.target.checked)}
                />
                <span>Скрыть от других</span>
              </label>
            )}
          </p>
          <p>
            <strong>Фамилия:</strong> {currentUser?.last_name || 'Не указано'}
            {isOwnProfile && (
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={currentUser?.is_last_name_private || false}
                  onChange={(e) => handlePrivacyChange('is_last_name_private', e.target.checked)}
                />
                <span>Скрыть от других</span>
              </label>
            )}
          </p>
          <p>
            <strong>Телефон:</strong> {currentUser?.phone || 'Не указано'}
            {isOwnProfile && (
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={currentUser?.is_phone_private || false}
                  onChange={(e) => handlePrivacyChange('is_phone_private', e.target.checked)}
                />
                <span>Скрыть от других</span>
              </label>
            )}
          </p>
          
          {/* Описание профиля */}
          <div className="profile-bio-section">
            <div className="profile-bio-header">
              <strong>О себе:</strong>
              {isOwnProfile && !isEditingBio && (
                <button 
                  onClick={() => setIsEditingBio(true)}
                  className="btn-edit-small"
                >
                  {currentUser?.bio ? 'Изменить' : 'Добавить'}
                </button>
              )}
            </div>
            {isOwnProfile && isEditingBio ? (
              <div className="bio-edit-form">
                <textarea
                  value={bioText}
                  onChange={(e) => handleBioChange(e.target.value)}
                  placeholder="Расскажите о себе..."
                  maxLength={500}
                  rows={4}
                  className="bio-textarea"
                />
                <div className="bio-actions">
                  <button 
                    onClick={handleSaveBio}
                    className="btn-save"
                    disabled={updateBioAndSocialMutation.isPending || !hasBioChanges}
                  >
                    {updateBioAndSocialMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={handleCancelBio}
                    className="btn-cancel"
                    disabled={updateBioAndSocialMutation.isPending}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <p className="profile-bio-text">
                {currentUser?.bio || (isOwnProfile ? 'Добавьте описание о себе' : 'Нет описания')}
              </p>
            )}
          </div>

          {/* Социальные сети */}
          <div className="profile-social-section">
            <div className="profile-social-header">
              <strong>Социальные сети:</strong>
              {isOwnProfile && !isEditingSocial && (
                <button 
                  onClick={() => setIsEditingSocial(true)}
                  className="btn-edit-small"
                >
                  Редактировать
                </button>
              )}
            </div>
            {isOwnProfile && isEditingSocial ? (
              <div className="social-edit-form">
                <div className="social-input-group">
                  <strong>
                    <i className="fa fa-instagram social-icon" aria-hidden="true"></i>
                    Instagram:
                  </strong>
                  <input
                    type="text"
                    value={socialLinks.instagram}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="@username или ссылка"
                  />
                </div>
                <div className="social-input-group">
                  <strong>
                    <i className="fa fa-telegram social-icon" aria-hidden="true"></i>
                    Telegram:
                  </strong>
                  <input
                    type="text"
                    value={socialLinks.telegram}
                    onChange={(e) => handleSocialChange('telegram', e.target.value)}
                    placeholder="@username или ссылка"
                  />
                </div>
                <div className="social-input-group">
                  <strong>
                    <i className="fa fa-youtube social-icon" aria-hidden="true"></i>
                    YouTube:
                  </strong>
                  <input
                    type="text"
                    value={socialLinks.youtube}
                    onChange={(e) => handleSocialChange('youtube', e.target.value)}
                    placeholder="@username или ссылка"
                  />
                </div>
                <div className="social-input-group">
                  <strong>
                    <i className="fa fa-vk social-icon" aria-hidden="true"></i>
                    VK:
                  </strong>
                  <input
                    type="text"
                    value={socialLinks.vk}
                    onChange={(e) => handleSocialChange('vk', e.target.value)}
                    placeholder="@username или ссылка"
                  />
                </div>
                <div className="social-actions">
                  <button 
                    onClick={handleSaveSocial}
                    className="btn-save"
                    disabled={updateBioAndSocialMutation.isPending || !hasSocialChanges}
                  >
                    {updateBioAndSocialMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    onClick={handleCancelSocial}
                    className="btn-cancel"
                    disabled={updateBioAndSocialMutation.isPending}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="social-links">
                {currentUser?.instagram_url && currentUser?.instagram_username && (
                  <a 
                    href={currentUser.instagram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ color: '#e7dfcc', textDecoration: 'none', gap: '1.5rem' }}
                  >
                    <i 
                      className="fa fa-instagram social-icon" 
                      aria-hidden="true"
                      style={{ fontSize: '1.75rem', color: '#e7dfcc' }}
                    ></i>
                    <span 
                      className="social-username"
                      style={{ color: '#e7dfcc', fontSize: '1.5rem', fontWeight: 500 }}
                    >
                      {currentUser.instagram_username}
                    </span>
                  </a>
                )}
                {currentUser?.telegram_url && currentUser?.telegram_username && (
                  <a 
                    href={currentUser.telegram_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ color: '#e7dfcc', textDecoration: 'none', gap: '1.5rem' }}
                  >
                    <i 
                      className="fa fa-telegram social-icon" 
                      aria-hidden="true"
                      style={{ fontSize: '1.75rem', color: '#e7dfcc' }}
                    ></i>
                    <span 
                      className="social-username"
                      style={{ color: '#e7dfcc', fontSize: '1.5rem', fontWeight: 500 }}
                    >
                      {currentUser.telegram_username}
                    </span>
                  </a>
                )}
                {currentUser?.youtube_url && currentUser?.youtube_username && (
                  <a 
                    href={currentUser.youtube_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ color: '#e7dfcc', textDecoration: 'none', gap: '1.5rem' }}
                  >
                    <i 
                      className="fa fa-youtube social-icon" 
                      aria-hidden="true"
                      style={{ fontSize: '1.75rem', color: '#e7dfcc' }}
                    ></i>
                    <span 
                      className="social-username"
                      style={{ color: '#e7dfcc', fontSize: '1.5rem', fontWeight: 500 }}
                    >
                      {currentUser.youtube_username}
                    </span>
                  </a>
                )}
                {currentUser?.vk_url && currentUser?.vk_username && (
                  <a 
                    href={currentUser.vk_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link"
                    style={{ color: '#e7dfcc', textDecoration: 'none', gap: '1.5rem' }}
                  >
                    <i 
                      className="fa fa-vk social-icon" 
                      aria-hidden="true"
                      style={{ fontSize: '1.75rem', color: '#e7dfcc' }}
                    ></i>
                    <span 
                      className="social-username"
                      style={{ color: '#e7dfcc', fontSize: '1.5rem', fontWeight: 500 }}
                    >
                      {currentUser.vk_username}
                    </span>
                  </a>
                )}
                {!currentUser?.instagram_url && !currentUser?.telegram_url && 
                 !currentUser?.youtube_url && !currentUser?.vk_url && (
                  <p className="no-social-links">
                    {isOwnProfile ? 'Добавьте ссылки на ваши социальные сети' : 'Нет социальных сетей'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Блок "Мои автомобили" */}
      <div className="profile-cars-section">
        <div className="profile-cars-header">
          <h2>{isOwnProfile ? 'Мои автомобили' : 'Автомобили'}</h2>
          {isOwnProfile && (
            <button 
              onClick={() => setShowAddCarForm(!showAddCarForm)}
              className="btn-add-car"
            >
              {showAddCarForm ? 'Отмена' : '+ Добавить автомобиль'}
            </button>
          )}
        </div>

        {/* Форма добавления автомобиля */}
        {isOwnProfile && showAddCarForm && (
          <form onSubmit={handleCarSubmit} className="add-car-form">
            <h3>Добавить новый автомобиль</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="brand">Марка *</label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={carFormData.brand}
                  onChange={handleCarChange}
                  placeholder="Например: Toyota"
                  className={carErrors.brand ? 'error' : ''}
                  required
                />
                {carErrors.brand && <span className="error-message">{carErrors.brand}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="model">Модель *</label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={carFormData.model}
                  onChange={handleCarChange}
                  placeholder="Например: Mark II"
                  className={carErrors.model ? 'error' : ''}
                  required
                />
                {carErrors.model && <span className="error-message">{carErrors.model}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="generation">Поколение/Кузов</label>
                <input
                  type="text"
                  id="generation"
                  name="generation"
                  value={carFormData.generation}
                  onChange={handleCarChange}
                  placeholder="Например: JZX90, E46, W210"
                  className={carErrors.generation ? 'error' : ''}
                />
                {carErrors.generation && <span className="error-message">{carErrors.generation}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="year">Год выпуска *</label>
                <input
                  type="number"
                  id="year"
                  name="year"
                  value={carFormData.year}
                  onChange={handleCarChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className={carErrors.year ? 'error' : ''}
                  required
                />
                {carErrors.year && <span className="error-message">{carErrors.year}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="license_plate">Госномер</label>
                <input
                  type="text"
                  id="license_plate"
                  name="license_plate"
                  value={carFormData.license_plate}
                  onChange={handleCarChange}
                  placeholder="Например: А123БВ777"
                  className={carErrors.license_plate ? 'error' : ''}
                />
                {carErrors.license_plate && <span className="error-message">{carErrors.license_plate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="vin">VIN-код</label>
                <input
                  type="text"
                  id="vin"
                  name="vin"
                  value={carFormData.vin}
                  onChange={handleCarChange}
                  placeholder="17 символов"
                  maxLength="17"
                  className={carErrors.vin ? 'error' : ''}
                />
                {carErrors.vin && <span className="error-message">{carErrors.vin}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="color">Цвет</label>
              <input
                type="text"
                id="color"
                name="color"
                value={carFormData.color}
                onChange={handleCarChange}
                placeholder="Например: Черный"
                className={carErrors.color ? 'error' : ''}
              />
              {carErrors.color && <span className="error-message">{carErrors.color}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="photo">Фото автомобиля</label>
              <input
                type="file"
                id="photo"
                name="photo"
                accept="image/*"
                onChange={handleCarChange}
                className={carErrors.photo ? 'error' : ''}
              />
              {carErrors.photo && <span className="error-message">{carErrors.photo}</span>}
              {carPhotoPreview && (
                <div className="photo-preview">
                  <img src={carPhotoPreview} alt="Предпросмотр" />
                </div>
              )}
            </div>

            {carErrors.general && (
              <div className="error-message general-error">{carErrors.general}</div>
            )}

            <div className="form-actions">
              <button type="submit" disabled={createCarMutation.isLoading}>
                {createCarMutation.isLoading ? 'Добавление...' : 'Добавить автомобиль'}
              </button>
            </div>
          </form>
        )}

        {/* Список автомобилей */}
        {isLoadingCars ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка автомобилей...</p>
          </div>
        ) : cars?.length === 0 ? (
          <div className="no-cars">
            <p>У вас пока нет автомобилей</p>
            <p>Добавьте свой первый автомобиль</p>
          </div>
        ) : (
          <div 
            className="cars-list"
            style={{
              gridTemplateColumns: cars.length === 1 ? '1fr' : cars.length === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              maxWidth: cars.length === 1 ? '400px' : cars.length === 2 ? '800px' : '1200px'
            }}
          >
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
      </div>

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

export default Profile

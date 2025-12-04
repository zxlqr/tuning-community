/**
 * Компонент галереи фото автомобиля
 * 
 * Отображает все фото автомобиля в виде галереи с возможностью:
 * - Просмотра фото в полноэкранном режиме
 * - Добавления новых фото
 * - Удаления фото
 * - Установки основного фото
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCarPhotos, addCarPhoto, deleteCarPhoto, setPrimaryPhoto } from '../../api/cars'
import './CarGallery.css'

const CarGallery = ({ car, onClose }) => {
  const queryClient = useQueryClient()
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [newPhoto, setNewPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isPrimary, setIsPrimary] = useState(false)

  // Загружаем фото автомобиля
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['car-photos', car.id],
    queryFn: () => getCarPhotos(car.id),
  })

  // Мутация для добавления фото
  const addPhotoMutation = useMutation({
    mutationFn: (data) => addCarPhoto(car.id, data.photo, data.isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries(['car-photos', car.id])
      queryClient.invalidateQueries(['cars'])
      setNewPhoto(null)
      setPhotoPreview(null)
      setShowAddPhoto(false)
      setIsPrimary(false)
    },
  })

  // Мутация для удаления фото
  const deletePhotoMutation = useMutation({
    mutationFn: (photoId) => deleteCarPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries(['car-photos', car.id])
      queryClient.invalidateQueries(['cars'])
      if (selectedPhotoIndex >= photos.length - 1) {
        setSelectedPhotoIndex(Math.max(0, photos.length - 2))
      }
    },
  })

  // Мутация для установки основного фото
  const setPrimaryMutation = useMutation({
    mutationFn: (photoId) => setPrimaryPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries(['car-photos', car.id])
      queryClient.invalidateQueries(['cars'])
    },
  })

  const handlePhotoSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Выберите изображение')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Размер файла не должен превышать 10 МБ')
        return
      }
      setNewPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddPhoto = () => {
    if (!newPhoto) return
    addPhotoMutation.mutate({ photo: newPhoto, isPrimary })
  }

  const handleDeletePhoto = (photoId) => {
    if (window.confirm('Удалить это фото?')) {
      deletePhotoMutation.mutate(photoId)
    }
  }

  const handleSetPrimary = (photoId) => {
    setPrimaryMutation.mutate(photoId)
  }

  const currentPhoto = photos[selectedPhotoIndex]

  return (
    <div className="car-gallery-overlay" onClick={onClose}>
      <div className="car-gallery" onClick={(e) => e.stopPropagation()}>
        <div className="gallery-header">
          <h2>
            {car.brand} {car.model}
            {car.generation && <span className="generation"> {car.generation}</span>}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {isLoading ? (
          <div className="gallery-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка фото...</p>
          </div>
        ) : photos.length === 0 && !showAddPhoto ? (
          <div className="gallery-empty">
            <i className="fa fa-camera" aria-hidden="true"></i>
            <p>Нет фото</p>
            <button className="btn-add-photo" onClick={() => setShowAddPhoto(true)}>
              Добавить фото
            </button>
          </div>
        ) : (
          <>
            {showAddPhoto ? (
              <div className="gallery-add-photo">
                <h3>Добавить фото</h3>
                <div className="photo-upload-area">
                  {photoPreview ? (
                    <div className="photo-preview-large">
                      <img src={photoPreview} alt="Предпросмотр" />
                      <button
                        className="btn-remove-preview"
                        onClick={() => {
                          setNewPhoto(null)
                          setPhotoPreview(null)
                        }}
                      >
                        <i className="fa fa-times" aria-hidden="true"></i>
                      </button>
                    </div>
                  ) : (
                    <label className="photo-upload-label">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoSelect}
                        style={{ display: 'none' }}
                      />
                      <i className="fa fa-cloud-upload" aria-hidden="true"></i>
                      <p>Нажмите для выбора фото</p>
                    </label>
                  )}
                </div>
                <div className="photo-options">
                  <label>
                    <input
                      type="checkbox"
                      checked={isPrimary}
                      onChange={(e) => setIsPrimary(e.target.checked)}
                    />
                    Сделать основным фото
                  </label>
                </div>
                <div className="photo-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowAddPhoto(false)
                      setNewPhoto(null)
                      setPhotoPreview(null)
                      setIsPrimary(false)
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleAddPhoto}
                    disabled={!newPhoto || addPhotoMutation.isLoading}
                  >
                    {addPhotoMutation.isLoading ? 'Загрузка...' : 'Добавить'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="gallery-main">
                  {currentPhoto && (
                    <div className="gallery-main-photo">
                      <img
                        src={currentPhoto.photo_url}
                        alt={`${car.brand} ${car.model}`}
                        onClick={() => setShowFullscreen(true)}
                      />
                      {currentPhoto.is_primary && (
                        <div className="primary-badge">
                          <i className="fa fa-star" aria-hidden="true"></i>
                          Основное фото
                        </div>
                      )}
                      <div className="photo-actions-overlay">
                        {!currentPhoto.is_primary && (
                          <button
                            className="btn-action"
                            onClick={() => handleSetPrimary(currentPhoto.id)}
                            title="Сделать основным"
                          >
                            <i className="fa fa-star" aria-hidden="true"></i>
                          </button>
                        )}
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeletePhoto(currentPhoto.id)}
                          title="Удалить"
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="gallery-thumbnails">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        className={`thumbnail ${index === selectedPhotoIndex ? 'active' : ''}`}
                        onClick={() => setSelectedPhotoIndex(index)}
                      >
                        <img src={photo.photo_url} alt={`Фото ${index + 1}`} />
                        {photo.is_primary && (
                          <div className="thumbnail-badge">
                            <i className="fa fa-star" aria-hidden="true"></i>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="gallery-footer">
                  <button className="btn-add-photo" onClick={() => setShowAddPhoto(true)}>
                    <i className="fa fa-plus" aria-hidden="true"></i>
                    Добавить фото
                  </button>
                  <div className="photo-counter">
                    {selectedPhotoIndex + 1} / {photos.length}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {showFullscreen && currentPhoto && (
          <div className="fullscreen-overlay" onClick={() => setShowFullscreen(false)}>
            <div className="fullscreen-photo" onClick={(e) => e.stopPropagation()}>
              <button className="close-fullscreen" onClick={() => setShowFullscreen(false)}>
                <i className="fa fa-times" aria-hidden="true"></i>
              </button>
              <img src={currentPhoto.photo_url} alt={`${car.brand} ${car.model}`} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CarGallery


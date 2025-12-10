import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import apiClient from '../../api/client'
import '../../styles/page-background.css'
import './Events.css'

/**
 * Страница мероприятий и сходок
 */
const Events = () => {
  const { isAuthenticated, user } = useAuth()
  const { showNotification } = useNotification()
  const queryClient = useQueryClient()
  const [showPast, setShowPast] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showLikesModal, setShowLikesModal] = useState(false)

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', showPast],
    queryFn: async () => {
      const response = await apiClient.get(`/events/events/?show_past=${showPast}`)
      return response.data
    },
  })

  // Загружаем информацию о лайках для каждого мероприятия
  const { data: likesData } = useQuery({
    queryKey: ['events-likes', selectedEvent?.id],
    queryFn: async () => {
      if (!selectedEvent) return null
      const response = await apiClient.get(`/events/events/${selectedEvent.id}/likes/`)
      return response.data
    },
    enabled: !!selectedEvent && showLikesModal,
  })


  const likeMutation = useMutation({
    mutationFn: async ({ eventId, is_anonymous }) => {
      const response = await apiClient.post(`/events/events/${eventId}/like/`, {
        is_anonymous: is_anonymous || false,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events', showPast])
      queryClient.invalidateQueries(['events-likes'])
      showNotification('Лайк поставлен!', 'success')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Ошибка при постановке лайка'
      showNotification(message, 'error')
    },
  })

  const unlikeMutation = useMutation({
    mutationFn: async (eventId) => {
      await apiClient.delete(`/events/events/${eventId}/like/`)
      return { eventId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['events', showPast])
      queryClient.invalidateQueries(['events-likes'])
      showNotification('Лайк убран', 'info')
    },
    onError: (error) => {
      const message = error.response?.data?.error || 'Ошибка при удалении лайка'
      showNotification(message, 'error')
    },
  })

  const handleLike = async (event, isAnonymous = false) => {
    if (!isAuthenticated) {
      showNotification('Войдите, чтобы поставить лайк', 'warning')
      return
    }

    // Проверяем, есть ли уже лайк
    try {
      const response = await apiClient.get(`/events/events/${event.id}/is_liked/`)
      const likeStatus = response.data
      
      if (likeStatus.is_liked) {
        // Убираем лайк
        unlikeMutation.mutate(event.id)
      } else {
        // Ставим лайк
        likeMutation.mutate({ eventId: event.id, is_anonymous: isAnonymous })
      }
    } catch (error) {
      // Если проверка не удалась, просто ставим лайк
      likeMutation.mutate({ eventId: event.id, is_anonymous: isAnonymous })
    }
  }

  const handleShowLikes = (event) => {
    setSelectedEvent(event)
    setShowLikesModal(true)
  }

  const handleCloseLikesModal = () => {
    setShowLikesModal(false)
    setSelectedEvent(null)
  }

  if (isLoading) {
    return (
      <div className="events page-background">
        <div className="events-container">
          <div className="events-loading">
            <div className="loading-spinner"></div>
            <p>Загрузка мероприятий...</p>
          </div>
        </div>
      </div>
    )
  }

  const eventsList = events?.results || events || []

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventTypeLabel = (type) => {
    const types = {
      meetup: 'Сходка',
      drift: 'Дрифт-встреча',
      show: 'Автошоу',
      race: 'Гонка',
      other: 'Другое'
    }
    return types[type] || type
  }

  const getEventTypeIcon = (type) => {
    // Убрали смайлики, возвращаем пустую строку
    return ''
  }

  return (
    <div className="events page-background">
      <div className="events-container">
        <div className="events-header">
          <div className="events-title-section">
            <h1>МЕРОПРИЯТИЯ</h1>
            <p className="events-subtitle">
              Анонсы сходок, дрифт-встреч и автошоу. Присоединяйся!
            </p>
          </div>
          <div className="events-controls">
            <button
              className={`filter-btn ${!showPast ? 'active' : ''}`}
              onClick={() => setShowPast(false)}
            >
              ПРЕДСТОЯЩИЕ
            </button>
            <button
              className={`filter-btn ${showPast ? 'active' : ''}`}
              onClick={() => setShowPast(true)}
            >
              ПРОШЕДШИЕ
            </button>
          </div>
        </div>

        {eventsList.length > 0 ? (
          <div className="events-grid">
            {eventsList.map(event => {
              // Формируем URL изображения - используем image_url из API или формируем из image
              let imageUrl = null
              if (event.image_url) {
                // Если image_url начинается с http, используем как есть
                // Иначе это относительный путь через прокси Vite
                imageUrl = event.image_url.startsWith('http') 
                  ? event.image_url 
                  : event.image_url
              } else if (event.image) {
                // Fallback на поле image
                imageUrl = event.image.startsWith('http') 
                  ? event.image 
                  : event.image.startsWith('/media/') 
                    ? event.image 
                    : `/media/${event.image}`
              }

              const likesCount = event.likes_count || event.participants_count || 0

              return (
                <div key={event.id} className="event-card">
                  {imageUrl ? (
                    <div className="event-image-wrapper">
                      <img 
                        src={imageUrl} 
                        alt={event.title}
                        className="event-image"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.classList.add('image-error')
                        }}
                        loading="lazy"
                      />
                      <div className="event-image-overlay"></div>
                      <div className="event-badges">
                        <span className="event-type-badge">
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="event-image-wrapper image-error">
                      <div className="event-image-placeholder">
                        <span>📷</span>
                        <p>Нет изображения</p>
                      </div>
                      <div className="event-badges">
                        <span className="event-type-badge">
                          {getEventTypeLabel(event.event_type)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="event-content">
                    <h3 className="event-title">{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-details">
                      <div className="event-detail-item">
                        <span className="detail-icon">📍</span>
                        <span className="detail-text">{event.location}</span>
                      </div>
                      <div className="event-detail-item">
                        <span className="detail-icon">📅</span>
                        <span className="detail-text">{formatDate(event.event_date)}</span>
                      </div>
                      {likesCount > 0 && (
                        <div 
                          className="event-detail-item clickable"
                          onClick={() => handleShowLikes(event)}
                          title="Кликните, чтобы посмотреть список участников"
                        >
                          <span className="detail-icon">❤️</span>
                          <span className="detail-text">
                            {likesCount} {likesCount === 1 ? 'участник планирует посетить' : likesCount < 5 ? 'участника планируют посетить' : 'участников планируют посетить'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="event-actions">
                      {isAuthenticated ? (
                        <div className="like-buttons">
                          <button 
                            className="btn-like"
                            onClick={() => handleLike(event, false)}
                            disabled={likeMutation.isLoading || unlikeMutation.isLoading}
                            title="Поставить лайк"
                          >
                            ❤️ ЛАЙК
                          </button>
                          <button 
                            className="btn-like-anonymous"
                            onClick={() => handleLike(event, true)}
                            disabled={likeMutation.isLoading || unlikeMutation.isLoading}
                            title="Поставить анонимный лайк"
                          >
                            👤 АНОНИМНО
                          </button>
                        </div>
                      ) : (
                        <Link to="/login" className="btn-like">
                          ВОЙТИ ДЛЯ ЛАЙКА
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="no-events">
            <div className="no-events-icon">📅</div>
            <h3>Мероприятия скоро появятся</h3>
            <p>Следите за обновлениями, мы готовим для вас интересные события!</p>
          </div>
        )}
      </div>

      {/* Модальное окно со списком лайков */}
      {showLikesModal && selectedEvent && (
        <div className="likes-modal-overlay" onClick={handleCloseLikesModal}>
          <div className="likes-modal" onClick={(e) => e.stopPropagation()}>
            <div className="likes-modal-header">
              <h2>Участники мероприятия "{selectedEvent.title}"</h2>
              <button className="likes-modal-close" onClick={handleCloseLikesModal}>×</button>
            </div>
            <div className="likes-modal-content">
              {likesData?.results && likesData.results.length > 0 ? (
                <div className="likes-list">
                  {likesData.results.map((like) => {
                    const isAnonymous = like.user === 'Аноним' || like.is_anonymous
                    // Используем user_id если есть, иначе username для перехода на профиль
                    const profilePath = isAnonymous 
                      ? null 
                      : `/profile/${like.user_id || like.user}`
                    
                    return (
                      <div key={like.id} className="like-item">
                        {like.user_avatar ? (
                          <img 
                            src={like.user_avatar} 
                            alt={like.user}
                            className="like-avatar"
                          />
                        ) : (
                          <div className="like-avatar-placeholder">
                            {isAnonymous ? '👤' : like.user.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="like-info">
                          {isAnonymous ? (
                            <span className="like-username">{like.user}</span>
                          ) : (
                            <Link 
                              to={profilePath}
                              className="like-username-link"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCloseLikesModal()
                              }}
                            >
                              {like.user}
                            </Link>
                          )}
                          <span className="like-date">
                            {new Date(like.created_at).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="no-likes">
                  <p>Пока нет лайков</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Events

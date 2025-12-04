import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import apiClient from '../../api/client'
import '../../styles/page-background.css'
import './Events.css'

/**
 * Страница мероприятий и сходок
 */
const Events = () => {
  const { isAuthenticated } = useAuth()
  const [showPast, setShowPast] = useState(false)

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', showPast],
    queryFn: () => 
      apiClient.get(`/events/events/?show_past=${showPast}`).then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="events page-background">
        <div className="container">
          <h1>Загрузка...</h1>
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

  return (
    <div className="events page-background">
      <div className="container">
        <div className="events-header">
          <h1>Мероприятия</h1>
          <div className="events-controls">
            <button
              className={`filter-btn ${!showPast ? 'active' : ''}`}
              onClick={() => setShowPast(false)}
            >
              Предстоящие
            </button>
            <button
              className={`filter-btn ${showPast ? 'active' : ''}`}
              onClick={() => setShowPast(true)}
            >
              Прошедшие
            </button>
          </div>
        </div>

        <p className="events-description">
          Анонсы сходок, дрифт-встреч и автошоу. 
          Присоединяйся!
        </p>

        <div className="events-grid">
          {eventsList.length > 0 ? (
            eventsList.map(event => (
              <div key={event.id} className="event-card">
                {event.image && (
                  <div className="event-image">
                    <img src={event.image} alt={event.title} />
                  </div>
                )}
                <div className="event-info">
                  <div className="event-header">
                    <span className="event-type">{getEventTypeLabel(event.event_type)}</span>
                    {event.is_registration_open && (
                      <span className="registration-open">Регистрация открыта</span>
                    )}
                  </div>
                  <h3>{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  <div className="event-details">
                    <div className="detail-item">
                      <span className="detail-label">📍</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📅</span>
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    {event.participants_count !== undefined && (
                      <div className="detail-item">
                        <span className="detail-label">👥</span>
                        <span>
                          {event.participants_count}
                          {event.max_participants && ` / ${event.max_participants}`} участников
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="event-actions">
                    {isAuthenticated ? (
                      <button className="btn-register">Зарегистрироваться</button>
                    ) : (
                      <Link to="/login" className="btn-register">
                        Войти для регистрации
                      </Link>
                    )}
                    <Link to={`/events/${event.id}`} className="btn-details">
                      Подробнее
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-events">Мероприятия скоро появятся</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Events


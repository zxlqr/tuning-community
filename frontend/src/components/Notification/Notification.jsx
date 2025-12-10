import { useEffect } from 'react'
import './Notification.css'

/**
 * Компонент уведомления
 * @param {string} message - Текст уведомления
 * @param {string} type - Тип уведомления: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Длительность отображения в миллисекундах (по умолчанию 3000)
 * @param {function} onClose - Функция закрытия уведомления
 */
const Notification = ({ message, type = 'success', duration = 3000, onClose }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <div className="notification-icon">
          {type === 'success' && '✓'}
          {type === 'error' && '✕'}
          {type === 'warning' && '⚠'}
          {type === 'info' && 'ℹ'}
        </div>
        <div className="notification-message">{message}</div>
        <button className="notification-close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}

export default Notification


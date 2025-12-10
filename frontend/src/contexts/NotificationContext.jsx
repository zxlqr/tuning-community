import { createContext, useContext, useState } from 'react'
import Notification from '../components/Notification/Notification'

const NotificationContext = createContext()

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setNotifications(prev => [...prev, { id, message, type, duration }])
    
    // Автоматически удаляем уведомление после указанного времени
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, duration)
    }
    
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const value = {
    showNotification,
    removeNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="notifications-container">
        {notifications.map(notif => (
          <Notification
            key={notif.id}
            message={notif.message}
            type={notif.type}
            duration={0} // Управляем через setTimeout
            onClose={() => removeNotification(notif.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}


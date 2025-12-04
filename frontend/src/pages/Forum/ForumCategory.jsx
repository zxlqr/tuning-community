/**
 * Страница категории форума - список тем
 * 
 * Отображает все темы в выбранной категории. Показывает информацию о каждой теме:
 * название, автора, количество просмотров и сообщений, дату последнего сообщения.
 * При клике на тему происходит переход к детальному просмотру.
 */
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from 'react-router-dom'
import { forumAPI } from '../../api/forum'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/page-background.css'
import './ForumCategory.css'

const ForumCategory = () => {
  const { slug } = useParams()  // Получаем slug категории из URL
  const { user } = useAuth()  // Получаем информацию о текущем пользователе

  // Загружаем список тем в категории
  const { data: topics, isLoading, error } = useQuery({
    queryKey: ['forum-topics', slug],
    queryFn: () => forumAPI.getTopics({ category_slug: slug }),
  })

  // Загружаем информацию о категории
  const { data: categories } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => forumAPI.getCategories(),
  })

  // Находим текущую категорию
  const currentCategory = categories?.results?.find(cat => cat.slug === slug)

  // Форматируем дату для отображения
  const formatDate = (dateString) => {
    if (!dateString) return 'Нет сообщений'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="forum-category-page">
        <div className="loading">Загрузка тем...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="forum-category-page">
        <div className="error">Ошибка при загрузке тем: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="forum-category-page page-background">
      <div className="category-header">
        <Link to="/forum" className="back-link">← Назад к категориям</Link>
        {currentCategory && (
          <div>
            <h1>{currentCategory.name}</h1>
            {currentCategory.description && (
              <p className="category-description">{currentCategory.description}</p>
            )}
          </div>
        )}
        {user && (
          <Link to={`/forum/category/${slug}/create-topic`} className="create-topic-btn">
            Создать тему
          </Link>
        )}
      </div>

      <div className="topics-list">
        {topics?.results?.length > 0 ? (
          <table className="topics-table">
            <thead>
              <tr>
                <th>Тема</th>
                <th>Автор</th>
                <th>Ответы</th>
                <th>Просмотры</th>
                <th>Последнее сообщение</th>
              </tr>
            </thead>
            <tbody>
              {topics.results.map(topic => (
                <tr key={topic.id} className={topic.is_pinned ? 'pinned' : ''}>
                  <td className="topic-title-cell">
                    <Link to={`/forum/topic/${topic.id}`} className="topic-link">
                      {topic.is_pinned && <span className="pin-icon">📌</span>}
                      {topic.is_locked && <span className="lock-icon">🔒</span>}
                      <span className="topic-title">{topic.title}</span>
                    </Link>
                  </td>
                  <td className="topic-author">{topic.author?.username || 'Неизвестно'}</td>
                  <td className="topic-posts-count">{topic.posts_count || 0}</td>
                  <td className="topic-views">{topic.views_count || 0}</td>
                  <td className="topic-last-post">
                    {topic.last_post_author && (
                      <div>
                        <div className="last-post-author">{topic.last_post_author}</div>
                        <div className="last-post-date">{formatDate(topic.last_post_date)}</div>
                      </div>
                    )}
                    {!topic.last_post_author && <span>Нет сообщений</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>В этой категории пока нет тем.</p>
            {user && (
              <Link to={`/forum/category/${slug}/create-topic`} className="create-topic-btn">
                Создать первую тему
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ForumCategory


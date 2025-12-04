/**
 * Страница форума - список категорий
 * 
 * Отображает все доступные категории форума с количеством тем в каждой.
 * При клике на категорию происходит переход к списку тем в этой категории.
 */
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { forumAPI } from '../../api/forum'
import '../../styles/page-background.css'
import './Forum.css'

const Forum = () => {
  // Загружаем список категорий с сервера
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => forumAPI.getCategories(),
  })

  // Показываем индикатор загрузки
  if (isLoading) {
    return (
      <div className="forum-page">
        <div className="loading">Загрузка категорий...</div>
      </div>
    )
  }

  // Показываем сообщение об ошибке
  if (error) {
    return (
      <div className="forum-page">
        <div className="error">Ошибка при загрузке категорий: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="forum-page">
      <div className="forum-header">
        <h1>Клуб автолюбителей</h1>
        <p className="forum-description">
          Добро пожаловать в наш клуб! Здесь вы можете обсудить тюнинг, ремонт, 
          поделиться опытом и задать вопросы другим автолюбителям.
        </p>
      </div>

      <div className="categories-list">
        {categories?.results?.length > 0 ? (
          categories.results.map(category => (
            <Link
              key={category.id}
              to={`/forum/category/${category.slug}`}
              className="category-card"
            >
              <div className="category-header">
                <h2>{category.name}</h2>
                <span className="topics-count">{category.topics_count || 0} тем</span>
              </div>
              {category.description && (
                <p className="category-description">{category.description}</p>
              )}
            </Link>
          ))
        ) : (
          <div className="empty-state">
            <p>Пока нет категорий. Они появятся позже.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Forum


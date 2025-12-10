/**
 * Страница темы форума - детальный просмотр
 * 
 * Отображает полную информацию о теме: название, содержание, автора, дату создания.
 * Показывает все сообщения в теме с возможностью поставить лайк.
 * Позволяет добавить новое сообщение (если тема не закрыта).
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { forumAPI } from '../../api/forum'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import '../../styles/page-background.css'
import './ForumTopic.css'

const ForumTopic = () => {
  const { id } = useParams()  // Получаем ID темы из URL
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const queryClient = useQueryClient()
  
  const [newPostContent, setNewPostContent] = useState('')
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [postImages, setPostImages] = useState([])
  const [postImagePreviews, setPostImagePreviews] = useState([])
  const [editingPost, setEditingPost] = useState(null)
  const [editingPostContent, setEditingPostContent] = useState('')
  const [editingTopic, setEditingTopic] = useState(false)
  const [editingTopicTitle, setEditingTopicTitle] = useState('')
  const [editingTopicContent, setEditingTopicContent] = useState('')

  // Загружаем детальную информацию о теме
  const { data: topic, isLoading, error } = useQuery({
    queryKey: ['forum-topic', id],
    queryFn: async () => {
      const data = await forumAPI.getTopic(id)
      // Для отладки - логируем данные темы
      console.log('=== ДАННЫЕ ТЕМЫ ===')
      console.log('ID темы:', id)
      console.log('Полные данные:', JSON.stringify(data, null, 2))
      console.log('Изображения темы:', data.images)
      console.log('Тип изображений:', typeof data.images)
      console.log('Это массив?', Array.isArray(data.images))
      console.log('Количество изображений:', data.images?.length)
      if (data.images && data.images.length > 0) {
        console.log('Первое изображение:', data.images[0])
        console.log('URL первого изображения:', data.images[0].image_url || data.images[0].image)
        console.log('Все поля первого изображения:', Object.keys(data.images[0]))
      } else {
        console.warn('⚠️ ИЗОБРАЖЕНИЙ НЕТ В ОТВЕТЕ API!')
        console.warn('Проверьте, что изображения загружены и связаны с темой')
      }
      return data
    },
    enabled: !!id, // Загружаем только если есть ID
    refetchOnWindowFocus: false, // Не перезагружаем при фокусе окна
  })

  // Мутация для создания нового сообщения
  const createPostMutation = useMutation({
    mutationFn: async (data) => {
      // Сначала создаем пост
      const postResponse = await forumAPI.createPost(data)
      const postId = postResponse.data.id
      
      // Затем загружаем изображения, если они есть
      if (postImages.length > 0) {
        const uploadPromises = postImages.map(imageFile => 
          forumAPI.uploadPostImage(postId, imageFile)
        )
        await Promise.all(uploadPromises)
      }
      
      return postResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-topic', id])
      setNewPostContent('')
      setPostImages([])
      setPostImagePreviews([])
      setShowReplyForm(false)
    },
  })

  // Мутация для лайка сообщения
  const toggleLikeMutation = useMutation({
    mutationFn: (postId) => forumAPI.toggleLike(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-topic', id])
    },
  })

  // Мутация для обновления поста
  const updatePostMutation = useMutation({
    mutationFn: ({ postId, data }) => forumAPI.updatePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-topic', id])
      setEditingPost(null)
      setEditingPostContent('')
    },
  })

  // Мутация для удаления поста
  const deletePostMutation = useMutation({
    mutationFn: (postId) => forumAPI.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-topic', id])
    },
  })

  // Мутация для обновления темы
  const updateTopicMutation = useMutation({
    mutationFn: (data) => forumAPI.updateTopic(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['forum-topic', id])
      setEditingTopic(false)
      setEditingTopicTitle('')
      setEditingTopicContent('')
    },
  })

  // Мутация для удаления темы
  const deleteTopicMutation = useMutation({
    mutationFn: () => forumAPI.deleteTopic(id),
    onSuccess: () => {
      // Получаем slug категории из данных темы
      const categorySlug = topic?.category_detail?.slug || topic?.category?.slug
      navigate(categorySlug ? `/forum/category/${categorySlug}` : '/forum')
    },
  })

  // Форматируем дату для отображения
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Обработчик отправки нового сообщения
  const handleSubmitPost = (e) => {
    e.preventDefault()
    if (!newPostContent.trim()) return

    createPostMutation.mutate({
      topic: parseInt(id),
      content: newPostContent,
    })
  }

  // Обработчик выбора изображений для поста
  const handlePostImageSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    
    // Ограничиваем количество изображений (максимум 10)
    const newFiles = files.slice(0, 10 - postImages.length)
    setPostImages([...postImages, ...newFiles])
    
    // Создаем превью для новых изображений
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPostImagePreviews(prev => [...prev, { file, preview: reader.result }])
      }
      reader.readAsDataURL(file)
    })
  }

  // Удаление изображения из поста
  const handleRemovePostImage = (index) => {
    setPostImages(postImages.filter((_, i) => i !== index))
    setPostImagePreviews(postImagePreviews.filter((_, i) => i !== index))
  }

  // Обработчик лайка
  const handleToggleLike = (postId) => {
    if (!user) {
      showNotification('Необходимо войти в систему для постановки лайка', 'warning')
      return
    }
    toggleLikeMutation.mutate(postId)
  }

  // Обработчик начала редактирования поста
  const handleStartEditPost = (post) => {
    setEditingPost(post.id)
    setEditingPostContent(post.content)
  }

  // Обработчик сохранения редактирования поста
  const handleSaveEditPost = (e) => {
    e.preventDefault()
    if (!editingPostContent.trim()) return
    updatePostMutation.mutate({
      postId: editingPost,
      data: { content: editingPostContent.trim() }
    })
  }

  // Обработчик удаления поста
  const handleDeletePost = (postId) => {
    if (window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
      deletePostMutation.mutate(postId)
    }
  }

  // Обработчик начала редактирования темы
  const handleStartEditTopic = () => {
    setEditingTopic(true)
    setEditingTopicTitle(topic.title)
    setEditingTopicContent(topic.content)
  }

  // Обработчик сохранения редактирования темы
  const handleSaveEditTopic = (e) => {
    e.preventDefault()
    if (!editingTopicTitle.trim() || !editingTopicContent.trim()) return
    updateTopicMutation.mutate({
      title: editingTopicTitle.trim(),
      content: editingTopicContent.trim()
    })
  }

  // Обработчик удаления темы
  const handleDeleteTopic = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту тему? Все сообщения также будут удалены.')) {
      deleteTopicMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="forum-topic-page page-background">
        <div className="loading">Загрузка темы...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="forum-topic-page page-background">
        <div className="error">Ошибка при загрузке темы: {error.message}</div>
      </div>
    )
  }

  if (!topic) {
    return (
      <div className="forum-topic-page page-background">
        <div className="error">Тема не найдена</div>
      </div>
    )
  }

  // Проверка прав на редактирование/удаление
  const canEditTopic = user && (topic.author?.id === user.id || user.is_staff || user.is_superuser)
  const canDeleteTopic = user && (topic.author?.id === user.id || user.is_staff || user.is_superuser)
  
  // Получаем slug категории (может быть в category_detail или нужно загрузить отдельно)
  const categorySlug = topic.category_detail?.slug || topic.category?.slug

  const canReply = user && !topic.is_locked

  return (
    <div className="forum-topic-page page-background">
      <div className="topic-header">
        <Link 
          to={categorySlug ? `/forum/category/${categorySlug}` : '/forum'} 
          className="back-link"
        >
          ← Назад к категории
        </Link>
        
        <div className="topic-title-section">
          {!editingTopic ? (
            <>
              <h1>
                {topic.is_pinned && <span className="pin-icon">📌</span>}
                {topic.is_locked && <span className="lock-icon">🔒</span>}
                {topic.title}
              </h1>
              <div className="topic-meta">
                <span className="topic-author-info">
                  <Link to={`/profile/${topic.author?.id}`} className="author-link">
                    {topic.author?.avatar_url && (
                      <img 
                        src={topic.author.avatar_url} 
                        alt={topic.author?.username || 'Автор'} 
                        className="author-avatar"
                      />
                    )}
                    <strong>{topic.author?.username || 'Неизвестно'}</strong>
                  </Link>
                </span>
                <span>Создано: {formatDate(topic.created_at)}</span>
                {topic.updated_at !== topic.created_at && (
                  <span>Обновлено: {formatDate(topic.updated_at)}</span>
                )}
                <span>Просмотров: {topic.views_count || 0}</span>
                <span>Сообщений: {topic.posts_count || 0}</span>
              </div>
              {canEditTopic && (
                <div className="topic-actions">
                  <button onClick={handleStartEditTopic} className="edit-btn">✏️ Редактировать</button>
                  {canDeleteTopic && (
                    <button onClick={handleDeleteTopic} className="delete-btn">🗑️ Удалить</button>
                  )}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveEditTopic} className="edit-topic-form">
              <input
                type="text"
                value={editingTopicTitle}
                onChange={(e) => setEditingTopicTitle(e.target.value)}
                placeholder="Название темы"
                className="edit-title-input"
                required
              />
              <textarea
                value={editingTopicContent}
                onChange={(e) => setEditingTopicContent(e.target.value)}
                placeholder="Содержание темы"
                rows={8}
                className="edit-content-input"
                required
              />
              <div className="edit-form-actions">
                <button type="submit" disabled={updateTopicMutation.isLoading}>
                  {updateTopicMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTopic(false)
                    setEditingTopicTitle('')
                    setEditingTopicContent('')
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Первое сообщение (содержание темы) - показываем только если не редактируем */}
      {!editingTopic && (
        <div className="topic-content post">
          <div className="post-header">
            <div className="post-author">
              <Link to={`/profile/${topic.author?.id}`} className="author-link">
                {topic.author?.avatar_url ? (
                  <img 
                    src={topic.author.avatar_url} 
                    alt={topic.author?.username || 'Автор'} 
                    className="author-avatar"
                  />
                ) : (
                  <div className="author-avatar">
                    {topic.author?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="author-info">
                  <div className="author-name">{topic.author?.username || 'Неизвестно'}</div>
                </div>
              </Link>
            </div>
            <div className="post-date">{formatDate(topic.created_at)}</div>
          </div>
        <div className="post-content">
          {topic.content}
        </div>
        {(() => {
          // Для отладки
          console.log('=== ОТОБРАЖЕНИЕ ИЗОБРАЖЕНИЙ ===')
          console.log('Изображения темы:', topic.images)
          console.log('Тип изображений:', typeof topic.images)
          console.log('Это массив?', Array.isArray(topic.images))
          console.log('Длина массива:', topic.images?.length)
          
          if (topic.images && Array.isArray(topic.images) && topic.images.length > 0) {
            console.log('✓ Изображения найдены, отображаем...')
            return (
              <div className="post-images">
                {topic.images.map((image, idx) => {
                  const imageUrl = image.image_url || image.image
                  console.log(`Изображение ${idx}:`, image, 'URL:', imageUrl)
                  if (!imageUrl) {
                    console.error('НЕТ URL ДЛЯ ИЗОБРАЖЕНИЯ!', image)
                  }
                  return (
                    <a
                      key={image.id || idx}
                      href={imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="post-image-link"
                    >
                      <img 
                        src={imageUrl} 
                        alt="Изображение" 
                        className="post-image"
                        onError={(e) => {
                          console.error('Ошибка загрузки изображения:', image, 'URL:', imageUrl)
                          e.target.style.display = 'none'
                        }}
                        onLoad={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log('Изображение загружено:', imageUrl)
                          }
                        }}
                      />
                    </a>
                  )
                })}
              </div>
            )
          }
          return null
        })()}
      </div>
      )}

      {/* Список сообщений */}
      {topic.posts && topic.posts.length > 0 && (
        <div className="posts-list">
          <h2>Ответы ({topic.posts.length})</h2>
          {topic.posts.map((post, index) => {
            const canEditPost = user && (post.author?.id === user.id || user.is_staff || user.is_superuser)
            const canDeletePost = user && (post.author?.id === user.id || user.is_staff || user.is_superuser)
            const isEditing = editingPost === post.id

            return (
              <div key={post.id} className="post">
                {!isEditing ? (
                  <>
                    <div className="post-header">
                      <div className="post-author">
                        <Link to={`/profile/${post.author?.id}`} className="author-link">
                          {post.author?.avatar_url ? (
                            <img 
                              src={post.author.avatar_url} 
                              alt={post.author?.username || 'Автор'} 
                              className="author-avatar"
                            />
                          ) : (
                            <div className="author-avatar">
                              {post.author?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="author-info">
                            <div className="author-name">{post.author?.username || 'Неизвестно'}</div>
                          </div>
                        </Link>
                      </div>
                      <div className="post-meta">
                        <div className="post-date">
                          {formatDate(post.created_at)}
                          {post.is_edited && (
                            <span className="edited-badge"> (отредактировано)</span>
                          )}
                        </div>
                        <div className="post-number">#{index + 1}</div>
                      </div>
                    </div>
              <div className="post-content">
                {post.content}
              </div>
              {post.images && post.images.length > 0 ? (
                <div className="post-images">
                  {post.images.map((image) => (
                    <a
                      key={image.id}
                      href={image.image_url || image.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="post-image-link"
                    >
                      <img 
                        src={image.image_url || image.image} 
                        alt="Изображение" 
                        className="post-image"
                        onError={(e) => {
                          console.error('Ошибка загрузки изображения:', image)
                          e.target.style.display = 'none'
                        }}
                      />
                    </a>
                  ))}
                </div>
              ) : null}
                    <div className="post-actions">
                      <button
                        className={`like-btn ${post.is_liked ? 'liked' : ''}`}
                        onClick={() => handleToggleLike(post.id)}
                        disabled={!user}
                        title={!user ? 'Войдите, чтобы поставить лайк' : ''}
                      >
                        ❤️ {post.likes_count || 0}
                      </button>
                      {canEditPost && (
                        <button
                          className="edit-post-btn"
                          onClick={() => handleStartEditPost(post)}
                          title="Редактировать"
                        >
                          ✏️
                        </button>
                      )}
                      {canDeletePost && (
                        <button
                          className="delete-post-btn"
                          onClick={() => handleDeletePost(post.id)}
                          title="Удалить"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <form onSubmit={handleSaveEditPost} className="edit-post-form">
                    <textarea
                      value={editingPostContent}
                      onChange={(e) => setEditingPostContent(e.target.value)}
                      placeholder="Введите текст сообщения..."
                      rows={6}
                      required
                      className="edit-post-textarea"
                    />
                    <div className="edit-post-actions">
                      <button type="submit" disabled={updatePostMutation.isLoading}>
                        {updatePostMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPost(null)
                          setEditingPostContent('')
                        }}
                      >
                        Отмена
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Форма для нового сообщения */}
      {canReply && (
        <div className="reply-section">
          {!showReplyForm ? (
            <button
              className="show-reply-form-btn"
              onClick={() => setShowReplyForm(true)}
            >
              Ответить
            </button>
          ) : (
            <form onSubmit={handleSubmitPost} className="reply-form">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Введите ваш ответ..."
                rows={6}
                required
              />
              <div className="form-group">
                <label htmlFor="post-images" className="image-upload-label">
                  📷 Добавить изображения (до 10 файлов)
                </label>
                <input
                  type="file"
                  id="post-images"
                  accept="image/*"
                  multiple
                  onChange={handlePostImageSelect}
                  className="image-input"
                />
                {postImagePreviews.length > 0 && (
                  <div className="image-previews">
                    {postImagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview">
                        <img src={preview.preview} alt={`Preview ${index + 1}`} />
                        <button
                          type="button"
                          onClick={() => handleRemovePostImage(index)}
                          className="remove-image-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="reply-form-actions">
                <button type="submit" disabled={createPostMutation.isLoading}>
                  {createPostMutation.isLoading ? 'Отправка...' : 'Отправить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false)
                    setNewPostContent('')
                    setPostImages([])
                    setPostImagePreviews([])
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {topic.is_locked && (
        <div className="locked-message">
          🔒 Эта тема закрыта для новых сообщений
        </div>
      )}

      {!user && (
        <div className="login-prompt">
          <Link to="/login">Войдите</Link>, чтобы участвовать в обсуждении
        </div>
      )}
    </div>
  )
}

export default ForumTopic


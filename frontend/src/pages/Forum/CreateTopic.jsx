/**
 * Страница создания новой темы форума
 * 
 * Позволяет авторизованным пользователям создать новую тему в выбранной категории.
 * Форма включает поле для названия темы и поле для содержания (первого сообщения).
 */
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { forumAPI } from '../../api/forum'
import { useAuth } from '../../contexts/AuthContext'
import '../../styles/page-background.css'
import './CreateTopic.css'

const CreateTopic = () => {
  const { slug } = useParams()  // Получаем slug категории из URL
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [imagePreviews, setImagePreviews] = useState([])
  const [errors, setErrors] = useState({})

  // Загружаем информацию о категории
  const { data: categories } = useQuery({
    queryKey: ['forum-categories'],
    queryFn: () => forumAPI.getCategories(),
  })

  const currentCategory = categories?.results?.find(cat => cat.slug === slug)

  // Мутация для создания темы
  const createTopicMutation = useMutation({
    mutationFn: async ({ topicData, imagesToUpload }) => {
      console.log('=== НАЧАЛО СОЗДАНИЯ ТЕМЫ ===')
      console.log('Данные темы:', topicData)
      console.log('Изображения для загрузки:', imagesToUpload)
      console.log('Количество изображений:', imagesToUpload?.length || 0)
      
      // Сначала создаем тему
      const topicResponse = await forumAPI.createTopic(topicData)
      const topicId = topicResponse.data.id
      console.log('Тема создана, ID:', topicId)
      
      // Затем загружаем изображения, если они есть
      if (imagesToUpload && imagesToUpload.length > 0) {
        try {
          console.log(`=== ЗАГРУЗКА ИЗОБРАЖЕНИЙ ===`)
          console.log(`Загрузка ${imagesToUpload.length} изображений для темы ${topicId}`)
          const uploadPromises = imagesToUpload.map((imageFile, index) => {
            console.log(`Загрузка изображения ${index + 1}/${images.length}:`, imageFile.name, 'Размер:', imageFile.size, 'Тип:', imageFile.type)
            return forumAPI.uploadTopicImage(topicId, imageFile)
              .then(result => {
                console.log(`✓ Изображение ${index + 1} загружено:`, result)
                return result
              })
              .catch(error => {
                console.error(`✗ Ошибка загрузки изображения ${index + 1}:`, error)
                throw error
              })
          })
          const results = await Promise.all(uploadPromises)
          console.log('=== ВСЕ ИЗОБРАЖЕНИЯ ЗАГРУЖЕНЫ ===')
          console.log('Результаты:', results)
          console.log('Количество успешно загруженных:', results.length)
        } catch (error) {
          console.error('=== ОШИБКА ПРИ ЗАГРУЗКЕ ИЗОБРАЖЕНИЙ ===')
          console.error('Детали ошибки:', error)
          console.error('Ответ сервера:', error.response?.data)
          console.error('Статус:', error.response?.status)
          // Продолжаем даже если изображения не загрузились
        }
      } else {
        console.log('=== НЕТ ИЗОБРАЖЕНИЙ ДЛЯ ЗАГРУЗКИ ===')
      }
      
      return topicResponse
    },
    onSuccess: async (response, variables) => {
      console.log('=== УСПЕШНОЕ СОЗДАНИЕ ТЕМЫ ===')
      const topicId = response.data.id
      const imagesToUpload = variables.imagesToUpload || []
      console.log('ID созданной темы:', topicId)
      console.log('Количество изображений для обработки:', imagesToUpload.length)
      
      // Обновляем кэш
      queryClient.invalidateQueries(['forum-topics', slug])
      
      // Если были загружены изображения, ждем немного и обновляем кэш темы
      if (imagesToUpload.length > 0) {
        console.log('Ожидание обработки изображений на сервере...')
        // Даем серверу время обработать изображения
        await new Promise(resolve => setTimeout(resolve, 1500))
        // Принудительно обновляем данные темы
        console.log('Обновление кэша темы...')
        queryClient.invalidateQueries(['forum-topic', topicId])
        // Принудительно перезагружаем данные темы
        await queryClient.refetchQueries(['forum-topic', topicId])
        console.log('Кэш обновлен и данные перезагружены, переход к теме...')
      } else {
        console.log('Нет изображений, переход к теме...')
      }
      
      // Переходим к созданной теме
      navigate(`/forum/topic/${topicId}`)
    },
    onError: (error) => {
      // Обрабатываем ошибки валидации
      if (error.response?.data) {
        setErrors(error.response.data)
      }
    },
  })

  // Обработчик отправки формы
  const handleSubmit = (e) => {
    e.preventDefault()
    setErrors({})

    if (!title.trim()) {
      setErrors({ title: 'Название темы обязательно' })
      return
    }

    if (!content.trim()) {
      setErrors({ content: 'Содержание темы обязательно' })
      return
    }

    if (!currentCategory) {
      setErrors({ category: 'Категория не найдена' })
      return
    }

    createTopicMutation.mutate({
      topicData: {
        title: title.trim(),
        content: content.trim(),
        category: currentCategory.id,
      },
      imagesToUpload: images,
    })
  }

  // Обработчик выбора изображений
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files)
    console.log('=== ВЫБРАНЫ ИЗОБРАЖЕНИЯ ===')
    console.log('Количество выбранных файлов:', files.length)
    console.log('Текущее количество изображений:', images.length)
    
    if (files.length === 0) {
      console.log('Нет файлов для обработки')
      return
    }
    
    // Ограничиваем количество изображений (максимум 10)
    const newFiles = files.slice(0, 10 - images.length)
    console.log('Новых файлов для добавления:', newFiles.length)
    console.log('Имена файлов:', newFiles.map(f => f.name))
    
    setImages(prev => {
      const updated = [...prev, ...newFiles]
      console.log('Обновленное состояние images:', updated.length, 'файлов')
      return updated
    })
    
    // Создаем превью для новых изображений
    newFiles.forEach((file, index) => {
      console.log(`Создание превью для файла ${index + 1}:`, file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviews(prev => {
          const updated = [...prev, { file, preview: reader.result }]
          console.log(`Превью создано, всего превью:`, updated.length)
          return updated
        })
      }
      reader.readAsDataURL(file)
    })
  }

  // Удаление изображения
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
    setImagePreviews(imagePreviews.filter((_, i) => i !== index))
  }

  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!user) {
    return (
      <div className="create-topic-page page-background">
        <div className="auth-required">
          <h2>Требуется авторизация</h2>
          <p>Для создания темы необходимо войти в систему.</p>
          <button onClick={() => navigate('/login')}>Войти</button>
        </div>
      </div>
    )
  }

  return (
    <div className="create-topic-page">
      <div className="create-topic-header">
        <h1>Создать новую тему</h1>
        {currentCategory && (
          <p className="category-info">
            Категория: <strong>{currentCategory.name}</strong>
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="create-topic-form">
        <div className="form-group">
          <label htmlFor="title">Название темы *</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Введите название темы"
            className={errors.title ? 'error' : ''}
            maxLength={200}
          />
          {errors.title && (
            <span className="error-message">{errors.title}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="content">Содержание темы *</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Опишите вашу тему подробнее..."
            rows={10}
            className={errors.content ? 'error' : ''}
          />
          {errors.content && (
            <span className="error-message">{errors.content}</span>
          )}
          <div className="char-count">
            {content.length} символов
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="images">Изображения (до 10 файлов)</label>
          <input
            type="file"
            id="images"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="image-input"
          />
          {imagePreviews.length > 0 && (
            <div className="image-previews">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="image-preview">
                  <img src={preview.preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="remove-image-btn"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {errors.non_field_errors && (
          <div className="error-message general-error">
            {Array.isArray(errors.non_field_errors)
              ? errors.non_field_errors.join(', ')
              : errors.non_field_errors}
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            disabled={createTopicMutation.isLoading}
            className="submit-btn"
          >
            {createTopicMutation.isLoading ? 'Создание...' : 'Создать тему'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/forum/category/${slug}`)}
            className="cancel-btn"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateTopic


import { useEffect, useRef, useState } from 'react'
import './VideoBackground.css'

/**
 * Компонент для видео-фона
 * 
 * @param {string} videoSrc - путь к видео файлу
 * @param {boolean} loop - зацикливать ли видео
 * @param {boolean} muted - отключить ли звук
 * @param {boolean} autoplay - автовоспроизведение
 * @param {string} poster - путь к изображению-заглушке
 */
const VideoBackground = ({ 
  videoSrc = '/videos/background.mp4',
  loop = true,
  muted = true,
  autoplay = true,
  poster = '/img/intro-bg.jpg'
}) => {
  const videoRef = useRef(null)
  const [videoError, setVideoError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Принудительно начинаем загрузку видео
      video.load()
      
      // Обработка событий загрузки видео
      const handleCanPlay = () => {
        // Видео готово к воспроизведению - сразу скрываем placeholder
        setIsLoading(false)
        setIsReady(true)
        video.play().catch(err => {
          console.error('Ошибка воспроизведения видео:', err)
        })
      }
      
      const handleCanPlayThrough = () => {
        // Видео полностью загружено и готово к воспроизведению без буферизации
        setIsReady(true)
        setIsLoading(false)
      }
      
      const handleLoadedData = () => {
        console.log('Видео загружено:', videoSrc)
        // Как только загрузились первые кадры, начинаем показывать видео
        setIsLoading(false)
        setIsReady(true)
      }
      
      const handleError = (e) => {
        console.error('Ошибка загрузки видео:', videoSrc, e)
        console.error('Видео не найдено по пути:', videoSrc)
        setVideoError(true)
        setIsLoading(false)
      }
      
      const handlePlaying = () => {
        // Видео начало воспроизводиться - точно готово
        setIsReady(true)
        setIsLoading(false)
      }
      
      const handleLoadedMetadata = () => {
        // Метаданные загружены - можно начинать показывать видео быстрее
        setIsLoading(false)
      }
      
      // Используем несколько событий для более надежной загрузки
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('canplay', handleCanPlay)
      video.addEventListener('canplaythrough', handleCanPlayThrough)
      video.addEventListener('loadeddata', handleLoadedData)
      video.addEventListener('playing', handlePlaying)
      video.addEventListener('error', handleError)
      
      // Попытка воспроизведения
      video.play().catch(err => {
        console.log('Автовоспроизведение видео заблокировано:', err)
      })
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('canplay', handleCanPlay)
        video.removeEventListener('canplaythrough', handleCanPlayThrough)
        video.removeEventListener('loadeddata', handleLoadedData)
        video.removeEventListener('playing', handlePlaying)
        video.removeEventListener('error', handleError)
      }
    }
  }, [videoSrc])

  // Если видео не загрузилось, используем фоновое изображение
  if (videoError) {
    return (
      <div className="video-background">
        <div 
          className="video-background__fallback"
          style={{
            backgroundImage: `url('${poster}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 0
          }}
        ></div>
        <div className="video-background__overlay"></div>
      </div>
    )
  }

  return (
    <div className="video-background">
      {/* Placeholder изображение пока видео загружается */}
      {isLoading && (
        <div 
          className="video-background__placeholder"
          style={{
            backgroundImage: `url('${poster}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            opacity: isReady ? 0 : 1,
            transition: 'opacity 0.2s ease-out',
            pointerEvents: 'none'
          }}
        ></div>
      )}
      <video
        ref={videoRef}
        className={`video-background__video ${isReady ? 'video-background__video--ready' : ''}`}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        playsInline
        preload="auto"
        poster={poster}
        onError={(e) => {
          console.error('Ошибка загрузки видео элемента:', videoSrc)
          console.error('Детали ошибки:', e)
          setVideoError(true)
          setIsLoading(false)
        }}
        onLoadedData={() => {
          console.log('Видео успешно загружено:', videoSrc)
          setVideoError(false)
        }}
        onLoadedMetadata={() => {
          setIsLoading(false)
        }}
        onCanPlay={() => {
          setIsLoading(false)
          setIsReady(true)
        }}
        onCanPlayThrough={() => {
          setIsReady(true)
          setIsLoading(false)
        }}
        onPlaying={() => {
          setIsReady(true)
          setIsLoading(false)
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        {/* Fallback для браузеров, которые не поддерживают видео */}
        Ваш браузер не поддерживает видео.
      </video>
      <div className="video-background__overlay"></div>
    </div>
  )
}

export default VideoBackground


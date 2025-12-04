import { useEffect, useRef, useState } from 'react'
import './VideoBackground.css'

/**
 * Компонент для видео-фона
 * 
 * @param {string} videoSrc - путь к видео файлу
 * @param {boolean} loop - зацикливать ли видео
 * @param {boolean} muted - отключить ли звук
 * @param {boolean} autoplay - автовоспроизведение
 */
const VideoBackground = ({ 
  videoSrc = '/videos/background.mp4',
  loop = true,
  muted = true,
  autoplay = true
}) => {
  const videoRef = useRef(null)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (video) {
      // Обработка событий загрузки видео
      const handleLoadedData = () => {
        console.log('Видео загружено:', videoSrc)
        video.play().catch(err => {
          console.error('Ошибка воспроизведения видео:', err)
        })
      }
      
      const handleError = (e) => {
        console.error('Ошибка загрузки видео:', videoSrc, e)
        console.error('Видео не найдено по пути:', videoSrc)
        setVideoError(true)
      }
      
      video.addEventListener('loadeddata', handleLoadedData)
      video.addEventListener('error', handleError)
      
      // Попытка воспроизведения
      video.play().catch(err => {
        console.log('Автовоспроизведение видео заблокировано:', err)
      })
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData)
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
            backgroundImage: "url('/img/intro-bg.jpg')",
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
      <video
        ref={videoRef}
        className="video-background__video"
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        playsInline
        preload="auto"
        onError={(e) => {
          console.error('Ошибка загрузки видео элемента:', videoSrc)
          console.error('Детали ошибки:', e)
          setVideoError(true)
        }}
        onLoadedData={() => {
          console.log('Видео успешно загружено:', videoSrc)
          setVideoError(false)
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


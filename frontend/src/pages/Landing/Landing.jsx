import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import VideoBackground from '../../components/VideoBackground/VideoBackground'
import './Landing.css'

// Главная страница - уличный стиль автомобильного сообщества
const Landing = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="landing-community">
      {/* Видео-фон */}
      <VideoBackground videoSrc="/videos/1118.mp4" />
      {/* Hero секция с граффити-стилем */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            <img 
              src="/img/logo/logo.png" 
              alt="OCEANGANG" 
              className="logo-image"
            />
            <span className="subtitle">Автомобильное сообщество</span>
          </h1>
          <p className="hero-description">
            Мы — объединение единомышленников, где каждый найдет свое место. 
            Дрифт, тюнинг, сходки и настоящая уличная культура.
          </p>
          <div className="hero-buttons">
            {!isAuthenticated ? (
              <>
                <Link to="/register" className="btn-primary">Присоединиться</Link>
                <Link to="/login" className="btn-secondary">Войти</Link>
              </>
            ) : (
              <>
                <Link to="/shop" className="btn-primary">Магазин</Link>
                <Link to="/forum" className="btn-primary">Форум</Link>
                <Link to="/events" className="btn-primary">Мероприятия</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-overlay"></div>
      </section>

      {/* О сообществе */}
      <section className="about-section">
        <div className="container">
          <h2 className="section-title">О нас</h2>
          <div className="about-grid">
            <div className="about-card">
              <div className="card-icon">🏎️</div>
              <h3>Дрифт и тюнинг</h3>
              <p>Снимаем контент о дрифте на улицах и треках. Делимся опытом и знаниями.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">🎁</div>
              <h3>Розыгрыши и магазин</h3>
              <p>Наклейки, атрибутика и даже автомобили. Регулярные розыгрыши для участников.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">🤝</div>
              <h3>Взаимопомощь</h3>
              <p>Наше сообщество всегда готово помочь — онлайн и в реальной жизни.</p>
            </div>
            <div className="about-card">
              <div className="card-icon">🎯</div>
              <h3>Сходки</h3>
              <p>Регулярные встречи, где можно показать свой автомобиль и пообщаться.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Функционал */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Что у нас есть</h2>
          <div className="features-grid">
            <Link to="/shop" className="feature-card">
              <div className="feature-number">01</div>
              <h3>Магазин</h3>
              <p>Наклейки, футболки, аксессуары с доставкой или самовывозом</p>
            </Link>
            <Link to="/events" className="feature-card">
              <div className="feature-number">02</div>
              <h3>Мероприятия</h3>
              <p>Анонсы сходок, дрифт-встреч и автошоу. Отметься, что придешь</p>
            </Link>
            <Link to="/forum" className="feature-card">
              <div className="feature-number">03</div>
              <h3>Форум</h3>
              <p>Обсуждения, советы по ремонту, организация любительских сходок</p>
            </Link>
            <Link to="/my-cars" className="feature-card">
              <div className="feature-number">04</div>
              <h3>Гараж</h3>
              <p>Твой личный гараж с фотографиями и информацией об автомобилях</p>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA секция */}
      <section className="cta-section">
        <div className="container">
          <h2 className="cta-title">Готов стать частью сообщества?</h2>
          <p className="cta-description">
            Присоединяйся к нам, покажи свой стиль и найди единомышленников
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="btn-cta">Регистрация</Link>
          )}
        </div>
      </section>
    </div>
  )
}

export default Landing

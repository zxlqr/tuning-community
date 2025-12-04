import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import './LandingNavigation.css'

/**
 * Навигация для лендинг-страницы в оригинальном стиле
 * 
 * Отображает меню навигации с якорными ссылками по странице
 * и ссылками на функциональные страницы приложения.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const LandingNavigation = () => {
  const { user, logout, isAuthenticated } = useAuth()  // Данные о пользователе
  const navigate = useNavigate()  // Для навигации после выхода

  /**
   * Обработчик выхода из системы
   * 
   * Выполняет выход и перенаправляет на главную страницу
   */
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  /**
   * Плавная прокрутка к секции на странице
   * 
   * Обрабатывает клики по якорным ссылкам и прокручивает страницу
   * к соответствующей секции с плавной анимацией.
   * 
   * @param {Event} e - Событие клика
   * @param {string} sectionId - ID секции для прокрутки
   */
  const handleScrollTo = (e, sectionId) => {
    e.preventDefault()
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })  // Плавная прокрутка
    }
  }

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
            aria-expanded="false"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <Link to="/" className="navbar-brand page-scroll">
            Homies
          </Link>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            {/* Якорные ссылки по странице */}
            <li>
              <a href="#features" className="page-scroll" onClick={(e) => handleScrollTo(e, 'features')}>
                Преимущества
              </a>
            </li>
            <li>
              <a href="#about" className="page-scroll" onClick={(e) => handleScrollTo(e, 'about')}>
                О нас
              </a>
            </li>
            <li>
              <a href="#services" className="page-scroll" onClick={(e) => handleScrollTo(e, 'services')}>
                Услуги
              </a>
            </li>
            <li>
              <a href="#portfolio" className="page-scroll" onClick={(e) => handleScrollTo(e, 'portfolio')}>
                Галерея
              </a>
            </li>
            <li>
              <a href="#testimonials" className="page-scroll" onClick={(e) => handleScrollTo(e, 'testimonials')}>
                Отзывы
              </a>
            </li>
            <li>
              <a href="#team" className="page-scroll" onClick={(e) => handleScrollTo(e, 'team')}>
                Команда
              </a>
            </li>
            <li>
              <a href="#contact" className="page-scroll" onClick={(e) => handleScrollTo(e, 'contact')}>
                Контакты
              </a>
            </li>
            {/* Функциональные страницы */}
            <li>
              <Link to="/services" className="page-scroll">
                Каталог услуг
              </Link>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/cart" className="page-scroll">
                    Корзина
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="page-scroll">
                    {user?.username || 'Профиль'}
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="btn-link">
                    Выход
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className="page-scroll">
                    Вход
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="page-scroll">
                    Регистрация
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}

export default LandingNavigation


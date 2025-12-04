// Шапка сайта - меню навигации, показывается везде кроме главной страницы
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import './Header.css'

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth()  // Данные о пользователе
  const navigate = useNavigate()  // Для навигации после выхода
  const location = useLocation()  // Для определения текущей страницы
  const { getTotalItems } = useCart()  // Данные о корзине

  // Выход из аккаунта и переход на главную
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="header-container">
        {/* Логотип/название сайта */}
        <Link to="/" className="logo">
          <img 
            src="/img/logo/logo.png" 
            alt="OCEANGANG" 
            className="logo-img"
          />
        </Link>
        {/* Навигационное меню */}
        <nav className="nav">
          <Link to="/shop" className={location.pathname === '/shop' ? 'active' : ''}>
            Магазин
          </Link>
          <Link to="/events" className={location.pathname === '/events' ? 'active' : ''}>
            Мероприятия
          </Link>
          <Link to="/forum" className={location.pathname === '/forum' ? 'active' : ''}>
            Форум
          </Link>
          {/* Показываем разные пункты меню в зависимости от авторизации */}
          {isAuthenticated ? (
            <>
              <Link to="/cart" className={location.pathname === '/cart' ? 'active' : ''}>
                Корзина
                {getTotalItems() > 0 && (
                  <span className="cart-badge">{getTotalItems()}</span>
                )}
              </Link>
              <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
                {user?.username}
              </Link>
              <button onClick={handleLogout}>Выход</button>
            </>
          ) : (
            <>
              <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>
                Вход
              </Link>
              <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>
                Регистрация
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header


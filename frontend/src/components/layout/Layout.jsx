import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import './Layout.css'

// Обертка для всех страниц - на главной странице скрывает Header и Footer
const Layout = ({ children }) => {
  const location = useLocation()
  const isLandingPage = location.pathname === '/'

  // На лендинге не показываем обычный Header и Footer
  if (isLandingPage) {
    return <>{children}</>
  }

  // На остальных страницах показываем стандартный Layout
  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout


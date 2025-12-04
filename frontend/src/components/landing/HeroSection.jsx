import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Компонент героической секции (главный баннер)
 * 
 * Отображает заголовок и описание компании с призывом к действию.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const HeroSection = ({ data }) => {
  const { isAuthenticated } = useAuth()
  
  if (!data) return null

  return (
    <header id="header">
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 intro-text">
                <h1>
                  {data.title || 'Мы автотюнинг ателье'}
                  <span></span>
                </h1>
                <p>{data.paragraph || 'Комплексный подход к тюнингу автомобилей: стиль, производительность и индивидуальность.'}</p>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link to="/services" className="btn btn-custom btn-lg page-scroll">
                    Наши услуги
                  </Link>
                  {isAuthenticated ? (
                    <Link to="/services" className="btn btn-custom btn-lg page-scroll">
                      Забронировать
                    </Link>
                  ) : (
                    <Link to="/register" className="btn btn-custom btn-lg page-scroll">
                      Начать работу
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default HeroSection


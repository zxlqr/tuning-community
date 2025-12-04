import { Link } from 'react-router-dom'

/**
 * Компонент "Наши услуги"
 * 
 * Отображает список услуг, предоставляемых ателье.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const WhatWeDo = ({ data }) => {
  if (!data || !Array.isArray(data)) return null

  return (
    <div id="services" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Наши услуги</h2>
          <p>Мы делаем не просто автомобили — мы создаём образы.</p>
        </div>
        <div className="row">
          {data.map((service, index) => (
            <div key={`service-${index}`} className="col-md-4">
              <i className={service.icon || 'fa fa-cog'}></i>
              <div className="service-desc">
                <h3>{service.name}</h3>
                <p>{service.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center" style={{ marginTop: '40px' }}>
          <Link to="/services" className="btn btn-custom btn-lg">
            Все услуги
          </Link>
        </div>
      </div>
    </div>
  )
}

export default WhatWeDo


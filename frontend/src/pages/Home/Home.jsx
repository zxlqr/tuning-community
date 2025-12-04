import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => {
  return (
    <div className="home">
      <section className="hero">
        <h1>Добро пожаловать в тюнинг-ателье</h1>
        <p>Профессиональные услуги по детейлингу, тюнингу и доработке автомобилей</p>
        <Link to="/services" className="cta-button">
          Посмотреть услуги
        </Link>
      </section>
      
      <section className="features">
        <h2>Наши услуги</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Детейлинг</h3>
            <p>Полная обработка кузова, защитные покрытия, полировка</p>
          </div>
          <div className="feature-card">
            <h3>Тюнинг</h3>
            <p>Чип-тюнинг, доработка двигателя, спортивные компоненты</p>
          </div>
          <div className="feature-card">
            <h3>Винил</h3>
            <p>Оклейка винилом, дизайн, защитные пленки</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home


import { useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Компонент контактной информации
 * 
 * Отображает контакты и форму обратной связи.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const GetInTouch = ({ data }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })

  if (!data) return null

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Реализовать отправку формы через API
    console.log('Отправка формы:', formData)
    alert('Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.')
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <div>
      <div id="contact">
        <div className="container">
          <div className="col-md-8">
            <div className="row">
              <div className="section-title">
                <h2>Свяжитесь с нами</h2>
                <p>
                  Пожалуйста, заполните форму ниже, чтобы отправить нам электронное письмо, и мы
                  свяжемся с вами как можно скорее.
                </p>
              </div>
              <form name="sentMessage" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        placeholder="Имя"
                        required
                        value={formData.name}
                        onChange={handleChange}
                      />
                      <p className="help-block text-danger"></p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                      />
                      <p className="help-block text-danger"></p>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    id="message"
                    className="form-control"
                    rows="4"
                    placeholder="Сообщение"
                    required
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                  <p className="help-block text-danger"></p>
                </div>
                <div id="success"></div>
                <button type="submit" className="btn btn-custom btn-lg">
                  отправить сообщение
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-3 col-md-offset-1 contact-info">
            <div className="contact-item">
              <h3>Контактная информация</h3>
              <p>
                <span>
                  <i className="fa fa-map-marker"></i> Адрес
                </span>
                {data.address || 'loading'}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-phone"></i> Телефон
                </span>{' '}
                {data.phone || 'loading'}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-envelope-o"></i> Email
                </span>{' '}
                {data.email || 'loading'}
              </p>
            </div>
            <div className="text-center" style={{ marginTop: '30px' }}>
              <Link to="/services" className="btn btn-custom btn-lg">
                Забронировать услугу
              </Link>
            </div>
          </div>
          <div className="col-md-12">
            <div className="row">
              <div className="social">
                <ul>
                  {data.whatsapp && (
                    <li>
                      <a href={data.whatsapp} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-whatsapp"></i>
                      </a>
                    </li>
                  )}
                  {data.telegram && (
                    <li>
                      <a href={data.telegram} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-paper-plane"></i>
                      </a>
                    </li>
                  )}
                  {data.youtube && (
                    <li>
                      <a href={data.youtube} target="_blank" rel="noopener noreferrer">
                        <i className="fa fa-youtube"></i>
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="footer">
        <div className="container text-center">
          <p>
            &copy; 2024 Design by{' '}
            <a href="https://t.me/zxlqr" rel="nofollow">
              ZXLQR
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default GetInTouch


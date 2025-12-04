/**
 * Компонент "О нас"
 * 
 * Отображает информацию о компании и её преимуществах.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const CompanyIntro = ({ data }) => {
  if (!data) return null

  return (
    <div id="about">
      <div className="container">
        <div className="row">
          <div className="col-xs-12 col-md-6">
            <img 
              src="/img/about.jpg" 
              className="img-responsive" 
              alt="О нас"
              onError={(e) => {
                // Если изображение не найдено, используем placeholder
                e.target.src = 'https://via.placeholder.com/520x400?text=О+нас'
              }}
            />
          </div>
          <div className="col-xs-12 col-md-6">
            <div className="about-text">
              <h2>О нас</h2>
              <p>{data.paragraph || 'loading...'}</p>
              <h3>Почему выбирают нас?</h3>
              <div className="list-style">
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul>
                    {data.Why ? data.Why.map((item, index) => (
                      <li key={`why-${index}`}>{item}</li>
                    )) : 'loading'}
                  </ul>
                </div>
                <div className="col-lg-6 col-sm-6 col-xs-12">
                  <ul>
                    {data.Why2 ? data.Why2.map((item, index) => (
                      <li key={`why2-${index}`}>{item}</li>
                    )) : 'loading'}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyIntro


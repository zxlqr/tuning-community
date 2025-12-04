/**
 * Компонент преимуществ компании
 * 
 * Отображает ключевые преимущества и особенности работы ателье.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const Advantages = ({ data }) => {
  if (!data || !Array.isArray(data)) return null

  return (
    <div id="features" className="text-center">
      <div className="container">
        <div className="col-md-10 col-md-offset-1 section-title">
          <h2>Преимущества</h2>
        </div>
        <div className="row">
          {data.map((item, index) => (
            <div key={`advantage-${index}`} className="col-xs-6 col-md-3">
              <i className={item.icon || 'fa fa-star'}></i>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Advantages


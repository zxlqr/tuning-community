/**
 * Компонент отзывов клиентов
 * 
 * Отображает отзывы довольных клиентов.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const ClientVoices = ({ data }) => {
  if (!data || !Array.isArray(data)) return null

  return (
    <div id="testimonials">
      <div className="container">
        <div className="section-title text-center">
          <h2>Отзывы клиентов</h2>
        </div>
        <div className="row">
          {data.map((testimonial, index) => (
            <div key={`testimonial-${index}`} className="col-md-4">
              <div className="testimonial">
                <div className="testimonial-image">
                  <img 
                    src={testimonial.img} 
                    alt={testimonial.name}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/64?text=Фото'
                    }}
                  />
                </div>
                <div className="testimonial-content">
                  <p>"{testimonial.text}"</p>
                  <div className="testimonial-meta">— {testimonial.name}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ClientVoices


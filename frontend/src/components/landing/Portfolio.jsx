/**
 * Компонент портфолио работ
 * 
 * Отображает галерею выполненных проектов.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const Portfolio = ({ data }) => {
  if (!data || !Array.isArray(data)) return null

  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Галерея работ</h2>
          <p>Посмотрите, как мы трансформируем и улучшаем автомобили.</p>
        </div>
        <div className="row">
          <div className="portfolio-items">
            {data.map((item, index) => (
              <div key={`portfolio-${index}`} className="col-sm-6 col-md-4 col-lg-4">
                <div className="portfolio-item">
                  <div className="hover-bg">
                    <a 
                      href={item.largeImage || item.smallImage} 
                      title={item.title} 
                      data-lightbox-gallery="gallery1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="hover-text">
                        <h4>{item.title}</h4>
                      </div>
                      <img 
                        src={item.smallImage || item.largeImage} 
                        className="img-responsive" 
                        alt={item.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Изображение'
                        }}
                      />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Portfolio


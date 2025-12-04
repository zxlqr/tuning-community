/**
 * Компонент команды
 * 
 * Отображает информацию о команде специалистов.
 * Использует оригинальный дизайн из Black-Box-Service.
 */
const OurPeople = ({ data }) => {
  if (!data || !Array.isArray(data)) return null

  return (
    <div id="team" className="text-center">
      <div className="container">
        <div className="col-md-8 col-md-offset-2 section-title">
          <h2>Наша команда</h2>
          <p>За каждым проектом стоит команда, которая горит своим делом.</p>
        </div>
        <div id="row">
          {data.map((person, index) => (
            <div key={`person-${index}`} className="col-md-3 col-sm-6 team">
              <div className="thumbnail">
                <img 
                  src={person.img} 
                  alt={person.name}
                  className="team-img"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/240?text=Фото'
                  }}
                />
                <div className="caption">
                  <h4>{person.name}</h4>
                  <p>{person.job}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default OurPeople


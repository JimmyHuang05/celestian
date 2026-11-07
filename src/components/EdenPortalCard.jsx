import './eden-portal-card.css'

export default function EdenPortalCard({ href, resonance, image, title, onClick }) {
  return <a href={href} onClick={onClick} data-eden-resonance={resonance} draggable="false" className="eden-portal tarot-card group w-full lg:w-auto h-auto lg:h-[45vh] xl:h-[55vh] 2xl:h-[65vh] aspect-[9/16] shrink-0 [container-type:inline-size]">
    <div className="eden-portal__art">
      <img src={image} alt="" fetchPriority="low" loading="eager" decoding="async" draggable="false" />
      <span className="eden-portal__shade" />
    </div>
    <div className="eden-portal__classic-frame" aria-hidden="true">
      <div>
        {['tl', 'tr', 'bl', 'br'].map(corner => <span key={corner} className={`eden-portal__corner eden-portal__corner--${corner}`} />)}
      </div>
    </div>
    <div className="eden-portal__caption">
      <h3 className="eden-portal__title font-yishan vertical-text hover-text-gold-stroke">{title}</h3>
      <span className="eden-portal__label font-serif" aria-hidden="true">{title}</span>
    </div>
  </a>
}

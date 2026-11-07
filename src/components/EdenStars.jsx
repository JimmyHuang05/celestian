import './eden-stars.css'

const random = seed => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return value - Math.floor(value)
}

// Both scenes use the same constellation, including its scale and brightness.
const STARS = Array.from({ length: 82 }, (_, i) => {
  const x = 5 + random(i + 1) * 90
  const y = 7 + random(i + 121) * 84
  return {
    x, y,
    size: i % 11 === 0 ? 5 + random(i + 231) * 4 : 1 + random(i + 231) * 2,
    delay: 2.65 + Math.hypot(x - 50, y - 45) / 38 + random(i + 411) * .5,
    opacity: .35 + random(i + 611) * .6,
    flare: i % 11 === 0,
  }
})

export default function EdenStars({ awaken = false }) {
  return <span className={`eden-stars${awaken ? ' eden-stars--awakening' : ''}`} aria-hidden="true">
    <span className="eden-stars__first"><span /></span>
    {STARS.map((star, i) => <span key={i} className={`eden-stars__point${star.flare ? ' eden-stars__point--flare' : ''}`} style={{
      left: `${star.x}%`, top: `${star.y}%`,
      '--star-size': `${star.size}px`, '--star-delay': `${star.delay}s`, '--star-opacity': star.opacity,
    }} />)}
  </span>
}

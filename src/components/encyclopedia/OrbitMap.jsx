const orbits = [
  { nodes: ['aeons', 'characters', 'factions'], rx: 300, ry: 185, angle: -32 },
  { nodes: ['enemies', 'relics'], rx: 395, ry: 235, angle: 37 },
  { nodes: ['gallery', 'terms'], rx: 470, ry: 160, angle: -14 },
]

export default function OrbitMap({ activeId }) {
  return (
    <svg className="galaxy-orbits" viewBox="0 0 1200 760" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="orbit-gold" x1="0" y1="1" x2="1" y2="0">
          <stop stopColor="#ecd49a" stopOpacity=".65" />
          <stop offset=".35" stopColor="#b9cde5" stopOpacity=".08" />
          <stop offset=".7" stopColor="#ecd49a" stopOpacity=".45" />
          <stop offset="1" stopColor="#b9cde5" stopOpacity=".06" />
        </linearGradient>
      </defs>
      <g className="galaxy-coordinate-lines" fill="none" stroke="#a9bbd6" strokeWidth=".6">
        <path d="M60 335H1140 M624 45V710 M180 90L1080 655 M135 660L1050 100" />
        <circle cx="624" cy="335" r="122" />
        <circle cx="624" cy="335" r="137" strokeDasharray="2 9" />
      </g>
      {orbits.map(({ nodes, rx, ry, angle }, index) => (
        <g key={index} className={`galaxy-orbit ${nodes.includes(activeId) ? 'is-lit' : ''}`} transform={`rotate(${angle} 624 335)`}>
          <ellipse cx="624" cy="335" rx={rx} ry={ry} fill="none" stroke="url(#orbit-gold)" />
          <ellipse className="galaxy-orbit-highlight" cx="624" cy="335" rx={rx} ry={ry} fill="none" stroke="#f3db9f" strokeDasharray="90 180 2 36" />
          <circle className="galaxy-orbit-star" cx={624 - rx} cy="335" r="4" />
          <circle className="galaxy-orbit-star" cx="624" cy={335 + ry} r="2.5" />
        </g>
      ))}
    </svg>
  )
}

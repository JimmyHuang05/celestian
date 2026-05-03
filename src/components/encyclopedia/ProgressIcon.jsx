function ProgressIcon({ current, total }) {
  const ratio = total > 0 ? current / total : 0
  const isComplete = current >= total

  const describeArc = () => {
    const r = 8
    const startAngle = Math.PI / 2
    const endAngle = startAngle + 2 * Math.PI * Math.min(ratio * 2, 1)
    const x1 = 12 + r * Math.cos(startAngle)
    const y1 = 12 - r * Math.sin(startAngle)
    const x2 = 12 + r * Math.cos(endAngle)
    const y2 = 12 - r * Math.sin(endAngle)
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`
  }

  return (
    <svg className="w-3.5 h-3.5 mr-1.5 inline-block" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#44403c" strokeWidth="1.5" />
      {isComplete ? (
        <circle cx="12" cy="12" r="8" fill="#d4b58e" />
      ) : (
        <path d={describeArc()} fill="none" stroke="#d4b58e" strokeWidth="2" opacity="0.9" />
      )}
      <circle cx="12" cy="12" r="1" fill={isComplete ? '#1c1917' : '#ffffff'} />
    </svg>
  )
}

export default ProgressIcon

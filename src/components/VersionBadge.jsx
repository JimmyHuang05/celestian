import { useState } from 'react'

const buildInfo = (typeof __BUILD_INFO__ !== 'undefined' ? __BUILD_INFO__ : {
  commit: 'unknown',
  branch: 'unknown',
  date: 'unknown',
  env: 'development',
})

const SHORT_HASH = buildInfo.commit
const DISPLAY_HASH = `#${SHORT_HASH}`

const TOOLTIP_LINES = [
  { label: '提交', value: SHORT_HASH },
  { label: '构建', value: buildInfo.date },
  { label: '分支', value: buildInfo.branch },
  { label: '环境', value: buildInfo.env },
]

function VersionBadge({ position = 'bottom-left' }) {
  const [isHovered, setIsHovered] = useState(false)

  const posClass = position === 'bottom-left'
    ? 'bottom-4 left-4 sm:left-6'
    : 'bottom-6 sm:bottom-8 right-4 sm:right-6'

  return (
    <div
      className={`absolute ${posClass} z-[1000] pointer-events-auto`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center">
        <div className={`
          flex items-center gap-2 px-2 py-1 rounded
          ${position === 'bottom-right'
            ? 'bg-[#1a1817]/90 backdrop-blur border border-gray-700'
            : 'cursor-pointer'
          }
          transition-all duration-300
        `}>
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-[#d4b58e] rounded-full" />
            <span className="text-[#d4b58e]/40 hover:text-[#d4b58e]/70 text-[10px] font-mono tracking-widest transition-colors duration-300">
              {DISPLAY_HASH}
            </span>
          </div>
        </div>

        {isHovered && (
          <div className={`
            absolute bottom-full mb-2
            ${position === 'bottom-left' ? 'left-0' : 'right-0'}
            bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl
            py-3 px-4 min-w-[160px]
            shadow-2xl
            transition-all duration-200
          `}>
            <div className="flex flex-col gap-1.5">
              <div className="text-[#d4b58e]/60 text-[9px] font-mono tracking-[0.3em] uppercase mb-1">BUILD INFO</div>
              {TOOLTIP_LINES.map(line => (
                <div key={line.label} className="flex items-center justify-between gap-4">
                  <span className="text-white/30 text-[10px] font-mono tracking-wider">{line.label}</span>
                  <span className="text-white/70 text-[10px] font-mono tracking-wider">{line.value}</span>
                </div>
              ))}
              <div className="mt-1.5 pt-1.5 border-t border-white/5">
                <span className="text-white/20 text-[8px] font-mono tracking-widest">CELESTIAN · JIMMYHUANG</span>
              </div>
            </div>
            <div className={`
              absolute -bottom-1
              ${position === 'bottom-left' ? 'left-5' : 'right-5'}
              w-2 h-2 bg-black border-r border-b border-white/10
              rotate-45
            `} />
          </div>
        )}
      </div>
    </div>
  )
}

export default VersionBadge

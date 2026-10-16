import ProgressIcon from './ProgressIcon.jsx'

function DataNode({ node, mouseX, mouseY, isMobile, onHoverNode, onClickNode }) {
  const handleClick = (e) => {
    if (onClickNode) onClickNode(node, e)
  }

  return (
    <div
      className="absolute flex flex-col items-center justify-center cursor-pointer group hardware-accelerated transition-transform duration-300 ease-out"
      style={{
        top: node.pos.top,
        left: node.pos.left,
        transform: `translate(-50%, -50%) scale(${node.scale}) translate(${-mouseX * 35 * node.scale}px, ${-mouseY * 35 * node.scale}px)`,
        zIndex: 100 - node.layer,
      }}
      onMouseEnter={onHoverNode}
      onClick={handleClick}
    >
      <div className="relative w-[140px] h-[140px] mb-3 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[#d4b58e] blur-[24px] opacity-10 group-hover:opacity-30 transition-opacity duration-500 z-0 pointer-events-none" />
        <div className="absolute inset-0 rounded-full border-[2px] border-[#d4b58e]/60 transition-colors duration-500 flex items-center justify-center z-10 group-hover:border-[#d4b58e]">
          <div className="absolute inset-0 rounded-full shadow-[0_0_25px_rgba(212,181,142,0.6)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="absolute w-[128px] h-[128px] rounded-full border border-[#d4b58e]/40 border-dashed group-hover:rotate-180 transition-transform duration-[3s] ease-linear hardware-accelerated" />
          <div className="absolute -top-[4px] w-2 h-2 bg-[#d4b58e] rotate-45 border border-[#1c1917]" />
          <div className="absolute -bottom-[4px] w-2 h-2 bg-[#d4b58e] rotate-45 border border-[#1c1917]" />
          <div className="absolute -left-[4px] w-2 h-2 bg-[#44403c] rotate-45 border border-[#1c1917] group-hover:bg-[#d4b58e] transition-colors" />
          <div className="absolute -right-[4px] w-2 h-2 bg-[#44403c] rotate-45 border border-[#1c1917] group-hover:bg-[#d4b58e] transition-colors" />
          <div className="relative w-[118px] h-[118px] rounded-full bg-transparent overflow-hidden border border-[#d4b58e]/30 flex items-center justify-center">
            {node.icon ? (
              <img src={node.icon} className="node-image w-full h-full object-cover rounded-full opacity-80 group-hover:opacity-100" draggable="false" onError={(e) => { e.target.style.display = 'none' }} />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#d4b58e] to-[#44403c] blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
            )}
            <div className="absolute inset-0 z-10 bg-transparent" />
          </div>
        </div>
        <div className="ripple-effect absolute w-32 h-32 rounded-full border border-[#d4b58e]/80 opacity-0 z-0 mix-blend-screen pointer-events-none hardware-accelerated" />
      </div>
      <div className="flex flex-col items-center text-center relative w-40" style={{ zIndex: 20 }}>
        <svg className="w-16 h-1.5 mb-1.5 opacity-60 transition-opacity group-hover:opacity-100 hardware-accelerated" viewBox="0 0 100 10">
          <line x1="0" y1="5" x2="40" y2="5" stroke="#d4b58e" strokeWidth="0.75" />
          <polygon points="50,2 53,5 50,8 47,5" fill="#d4b58e" />
          <line x1="60" y1="5" x2="100" y2="5" stroke="#d4b58e" strokeWidth="0.75" />
        </svg>
        <h3 className="text-[#e7e5e4] text-xl tracking-[0.25em] font-yishan font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] mb-0.5 transition-colors group-hover:text-[#d4b58e]">{node.title}</h3>
        <div className="font-serif font-bold text-[#d4b58e]/70 text-[11px] tracking-widest -mt-1 mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity">{node.subtitle}</div>
        <div className="flex items-center text-[#d4b58e] text-xs font-mono tracking-wider bg-[#292524]/80 px-3 py-0.5 rounded backdrop-blur-md border border-[#d4b58e]/20 group-hover:border-[#d4b58e]/60 group-hover:bg-[#44403c]/60 transition-colors">
          <ProgressIcon current={node.current} total={node.total} />
          <span className="font-light">{node.current}<span className="text-[#8c7355] mx-[2px]">/</span>{node.total}</span>
        </div>
        <div className="whitespace-nowrap text-[9px] text-[#d4b58e]/40 font-mono tracking-[0.4em] uppercase mt-2 font-light opacity-60 group-hover:opacity-100 transition-opacity flex items-center justify-center w-full">
          <span className="w-2 h-[1px] bg-[#d4b58e]/20 mr-2" />
          <span>{node.alien}</span>
          <span className="w-2 h-[1px] bg-[#d4b58e]/20 ml-2" />
        </div>
      </div>
    </div>
  )
}

export default DataNode

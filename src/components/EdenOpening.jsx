import { useState } from 'react'
import '../fonts/eden-seal.css'
import './eden-opening.css'

export default function EdenOpening({ onPhaseChange }) {
  const [entered, setEntered] = useState(() => sessionStorage.getItem('eden-entered') === 'true')
  function enter() {
    sessionStorage.setItem('eden-entered', 'true')
    setEntered(true)
    onPhaseChange?.('entered')
  }
  if (entered) return null
  return <button type="button" className="eden-opening" onClick={enter} aria-label="进入无光的伊甸园">
    <span className="eden-opening__identity">
      <img className="eden-opening__logo" src="/images/eden/celestian-requiem-prayer-v3.png" width="2172" height="724" alt="CELESTIAN REQUIEM" />
      <span className="eden-opening__subtitle">无光的伊甸园</span>
    </span>
    <span className="eden-opening__start"><span />点击任意位置开始<span /></span>
    <span className="eden-opening__footer">CELESTIAN</span>
  </button>
}

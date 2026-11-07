import './eden-hall.css'

export default function EdenHall({ phase }) {
  return <div className="eden-hall" data-phase={phase} aria-hidden="true" />
}

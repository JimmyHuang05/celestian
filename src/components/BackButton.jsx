import { useNavigate } from 'react-router-dom'

function BackButton({ to = '/', className = '', children, ...props }) {
  const navigate = useNavigate()

  return (
    <button onClick={() => navigate(to)} className={className} {...props}>
      {children}
    </button>
  )
}

export default BackButton

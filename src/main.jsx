import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import BackgroundMusic from './components/BackgroundMusic.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <BackgroundMusic><App /></BackgroundMusic>
    </BrowserRouter>
  </StrictMode>,
)

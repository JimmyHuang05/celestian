import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename="/old">
      <App />
      <a className="archive-return" href="/" aria-label="离开怀旧版，返回新版">怀旧版 · 返回新版 ↗</a>
    </BrowserRouter>
  </StrictMode>,
)

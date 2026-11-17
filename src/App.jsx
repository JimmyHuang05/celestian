import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import MapPage from './pages/MapPage.jsx'
import MapPlusWorkbench from './pages/MapPlusWorkbench.jsx'
import { MAPPLUS_WONDERS_ENABLED } from './map-landmarks.js'
import { lazy, Suspense } from 'react'
const EncyclopediaPage = lazy(() => import('./pages/EncyclopediaPage.jsx'))
const MapMigrationPage = lazy(() => import('./pages/MapMigrationPage.jsx'))
const MapPainterPage = lazy(() => import('./pages/MapPainterPage.jsx'))
const MapWaterEditorPage = lazy(() => import('./pages/MapWaterEditorPage.jsx'))
const MapCopyEditor = lazy(() => import('./pages/MapCopyEditor.jsx'))
const FunctionsPage = lazy(() => import('./pages/FunctionsPage.jsx'))
const BadgePage = lazy(() => import('./pages/BadgePage.jsx'))

export default function App() {
  const encyclopedia = <ErrorBoundary><Suspense fallback={null}><EncyclopediaPage /></Suspense></ErrorBoundary>
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/encyclopedia/" replace />} />
      <Route path="/encyclopedia" element={encyclopedia} />
      <Route path="/encyclopedia/gallery" element={<Navigate to="/map/" replace />} />
      <Route path="/encyclopedia/:nodeId" element={encyclopedia} />
      <Route path="/map" element={<ErrorBoundary><MapPage /></ErrorBoundary>} />
      <Route path="/mapplus" element={<ErrorBoundary><MapPage key="mapplus" mapPlus /></ErrorBoundary>} />
      <Route path="/mapplus/workbench" element={<Navigate to="/mapplus/migrate" replace />} />
      <Route element={<MapPlusWorkbench />}>
        <Route path="/mapplus/copy" element={import.meta.env.DEV ? <ErrorBoundary><Suspense fallback={<div>正在打开文案室…</div>}><MapCopyEditor /></Suspense></ErrorBoundary> : <Navigate to="/mapplus" replace />} />
        <Route path="/mapplus/migrate" element={<ErrorBoundary><Suspense fallback={null}><MapMigrationPage /></Suspense></ErrorBoundary>} />
        <Route path="/mapplus/paint" element={<ErrorBoundary><Suspense fallback={<div>正在打开涂色工作台…</div>}><MapPainterPage key="mapplus" mapPlus /></Suspense></ErrorBoundary>} />
      </Route>
      <Route path="/mapplus/text" element={<Navigate to="/mapplus/migrate?tab=text" replace />} />
      <Route path="/mapplus/wonders" element={<Navigate to={MAPPLUS_WONDERS_ENABLED ? '/mapplus/migrate?tab=wonders' : '/mapplus/migrate'} replace />} />
      <Route path="/mapplus/water" element={<ErrorBoundary><Suspense fallback={null}><MapWaterEditorPage /></Suspense></ErrorBoundary>} />
      <Route path="/mapplus/parcels" element={<Navigate to="/mapplus/paint" replace />} />
      <Route path="/mapplus/place" element={<Navigate to="/mapplus/migrate?tab=places" replace />} />
      <Route path="/map-painter" element={<ErrorBoundary><Suspense fallback={<div>正在打开涂色工作台…</div>}><MapPainterPage /></Suspense></ErrorBoundary>} />
      <Route path="/functions/badge" element={<ErrorBoundary><Suspense fallback={null}><BadgePage /></Suspense></ErrorBoundary>} />
      <Route path="/functions/*" element={<ErrorBoundary><Suspense fallback={null}><FunctionsPage /></Suspense></ErrorBoundary>} />
    </Routes>
  )
}

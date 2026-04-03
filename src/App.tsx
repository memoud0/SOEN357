import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardRoute } from './routes/DashboardRoute'
import { HomeRoute } from './routes/HomeRoute'
import { NotFoundRoute } from './routes/NotFoundRoute'
import { RoadmapRoute } from './routes/RoadmapRoute'
import { SessionRoute } from './routes/SessionRoute'
import { SettingsRoute } from './routes/SettingsRoute'
import { WizardRoute } from './routes/WizardRoute'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/wizard" element={<WizardRoute />} />
        <Route path="/roadmap/:projectId" element={<RoadmapRoute />} />
        <Route path="/session/:projectId" element={<SessionRoute />} />
        <Route path="/dashboard/:projectId" element={<DashboardRoute />} />
        <Route path="/settings" element={<SettingsRoute />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundRoute />} />
      </Route>
    </Routes>
  )
}

export default App

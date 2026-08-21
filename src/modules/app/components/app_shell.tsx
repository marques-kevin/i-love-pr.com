import { Navigate, Route, Routes } from 'react-router-dom'
import { RepoDashboardPage } from '@/modules/dashboard/components/repo_dashboard_page'
import { HomePage } from './home_page'

export function AppShell() {
  return (
    <div className="bg-base-200 min-h-screen overflow-x-hidden">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/r/:owner/:name" element={<RepoDashboardPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

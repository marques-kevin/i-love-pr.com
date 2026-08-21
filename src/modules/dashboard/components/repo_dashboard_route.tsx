import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { is_known_repo } from '@/lib/repo_path'
import { Dashboard } from './dashboard'
import { DashboardHeader } from './dashboard_header'
import { connector, type ConnectorProps } from './repo_dashboard_route.connector'

export function Wrapper({ repos, active_repo, set_active_repo }: ConnectorProps) {
  const { owner, name } = useParams()
  const repo = owner && name ? `${owner}/${name}` : null
  const known = is_known_repo(repo, repos)

  useEffect(() => {
    if (!known || !repo || repo === active_repo) return
    void set_active_repo(repo)
  }, [known, repo, active_repo, set_active_repo])

  if (!known) {
    return <Navigate to="/" replace />
  }

  return (
    <>
      <DashboardHeader />
      <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
    </>
  )
}

export const RepoDashboardRoute = connector(Wrapper)

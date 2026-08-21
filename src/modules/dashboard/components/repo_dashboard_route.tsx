import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { is_known_repo } from '@/lib/repo_path'
import {
  TAB_CROSSFADE_DURATION_S,
  dashboard_window_motion,
} from '@/modules/dashboard/lib/window_chrome'
import { Dashboard } from './dashboard'
import { DashboardHeader } from './dashboard_header'
import { DashboardToolbar } from './dashboard_toolbar'
import { connector, type ConnectorProps } from './repo_dashboard_route.connector'

export function Wrapper({
  repos,
  active_repo,
  active_dashboard_id,
  set_active_repo,
}: ConnectorProps) {
  const { owner, name } = useParams()
  const navigate = useNavigate()
  const reduce_motion = useReducedMotion() === true
  const window_motion = dashboard_window_motion(reduce_motion)
  const [close_pending, set_close_pending] = useState(false)
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
    <div className="p-3 sm:p-5">
      <AnimatePresence onExitComplete={() => void navigate('/')}>
        {close_pending ? null : (
          <motion.div
            key="dashboard-window"
            className="dashboard-window mx-auto flex min-h-[calc(100svh-1.5rem)] w-full max-w-[90rem] flex-col rounded-[1.75rem] bg-base-100 shadow-sm ring-1 ring-base-content/10 sm:min-h-[calc(100svh-2.5rem)]"
            initial={window_motion.initial}
            animate={window_motion.animate}
            exit={window_motion.exit}
          >
            <div className="sticky top-0 z-40">
              <DashboardHeader on_close_window={() => set_close_pending(true)} />
              <DashboardToolbar />
            </div>
            <div className="bg-base-100 flex-1 px-4 py-6 sm:px-6 lg:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active_dashboard_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: TAB_CROSSFADE_DURATION_S }}
                >
                  <Dashboard />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const RepoDashboardRoute = connector(Wrapper)

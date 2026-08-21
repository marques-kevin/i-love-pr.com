import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  dashboard_body_transition,
  dashboard_body_variants,
  dashboard_window_transition,
  dashboard_window_variants,
} from '@/lib/dashboard_window_motion'
import { is_known_repo } from '@/lib/repo_path'
import { Dashboard } from './dashboard'
import { DashboardHeader } from './dashboard_header'
import { connector, type ConnectorProps } from './repo_dashboard_route.connector'

export function Wrapper({
  repos,
  active_repo,
  active_dashboard_id,
  set_active_repo,
}: ConnectorProps) {
  const navigate = useNavigate()
  const reduce_motion = useReducedMotion() ?? false
  const { owner, name } = useParams()
  const repo = owner && name ? `${owner}/${name}` : null
  const known = is_known_repo(repo, repos)
  const [closing, set_closing] = useState(false)

  useEffect(() => {
    if (!known || !repo || repo === active_repo) return
    void set_active_repo(repo)
  }, [known, repo, active_repo, set_active_repo])

  if (!known) {
    return <Navigate to="/" replace />
  }

  const request_close = () => {
    if (closing) return
    set_closing(true)
  }

  return (
    <div className="p-3 sm:p-5">
      <motion.div
        className="dashboard-window mx-auto w-full max-w-[90rem] overflow-hidden rounded-[1.75rem] bg-base-100 shadow-sm ring-1 ring-base-content/10"
        variants={dashboard_window_variants(reduce_motion)}
        initial="initial"
        animate={closing ? 'exit' : 'animate'}
        transition={dashboard_window_transition(closing ? 'exit' : 'enter', reduce_motion)}
        onAnimationComplete={() => {
          if (closing) navigate('/', { replace: true })
        }}
      >
        <div className="sticky top-0 z-10 bg-base-200 px-2 pt-2 sm:px-3">
          <DashboardHeader on_close_window={request_close} />
        </div>

        <div className="bg-base-100">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active_dashboard_id}
              variants={dashboard_body_variants()}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={dashboard_body_transition()}
            >
              <Dashboard />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}

export const RepoDashboardRoute = connector(Wrapper)

import { Button } from '@/components/ui/button'
import { connector, type ConnectorProps } from './repo_filter.connector'

export function Wrapper({ repos, selected_repos, set_selected_repos }: ConnectorProps) {
  function toggle_repo(repo: string) {
    if (selected_repos.includes(repo)) {
      if (selected_repos.length === 1) return
      set_selected_repos(selected_repos.filter((r) => r !== repo))
    } else {
      set_selected_repos([...selected_repos, repo])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {repos.map((repo) => {
        const active = selected_repos.includes(repo)
        return (
          <Button
            key={repo}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            onClick={() => toggle_repo(repo)}
          >
            {repo}
          </Button>
        )
      })}
    </div>
  )
}

export const RepoFilter = connector(Wrapper)

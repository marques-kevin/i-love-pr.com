import type { RepoRecord } from '@/lib/types'

export type RepoGallerySections = {
  my_repositories: string[]
  imported: string[]
}

export function split_repos_for_gallery(
  repo_names: string[],
  repo_records: RepoRecord[],
): RepoGallerySections {
  const imported_set = new Set(
    repo_records.filter((record) => record.source === 'import').map((record) => record.full_name),
  )
  const my_repositories: string[] = []
  const imported: string[] = []

  for (const full_name of repo_names) {
    if (imported_set.has(full_name)) {
      imported.push(full_name)
    } else {
      my_repositories.push(full_name)
    }
  }

  return { my_repositories, imported }
}

import type { AppSettings } from '@/lib/types'

export type RepoGalleryPartition = {
  own: string[]
  imported: string[]
}

export function is_imported_repo(
  settings: Pick<AppSettings, 'imported_repos'> | null | undefined,
  repo_full_name: string,
): boolean {
  return (settings?.imported_repos ?? []).includes(repo_full_name)
}

export function partition_gallery_repos(
  repos: string[],
  imported_repos: string[] | undefined,
): RepoGalleryPartition {
  const imported_set = new Set(imported_repos ?? [])
  const own: string[] = []
  const imported: string[] = []

  for (const full_name of repos) {
    if (imported_set.has(full_name)) {
      imported.push(full_name)
    } else {
      own.push(full_name)
    }
  }

  return { own, imported }
}

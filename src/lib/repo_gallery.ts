export type GalleryRepoPartition = {
  own: string[]
  imported: string[]
}

export function partition_gallery_repos(
  repos: string[],
  imported_repos: string[] | undefined,
): GalleryRepoPartition {
  const imported_set = new Set(imported_repos ?? [])
  const own: string[] = []
  const imported: string[] = []

  for (const repo of repos) {
    if (imported_set.has(repo)) {
      imported.push(repo)
    } else {
      own.push(repo)
    }
  }

  return { own, imported }
}

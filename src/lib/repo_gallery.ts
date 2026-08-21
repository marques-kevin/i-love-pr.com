export type RepoGalleryPartition = {
  own: string[]
  imported: string[]
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

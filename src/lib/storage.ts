export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
  try {
    const already = await navigator.storage.persisted()
    if (already) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export async function estimateStorage(): Promise<{
  usage: number
  quota: number
  usagePercent: number
} | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
  try {
    const estimate = await navigator.storage.estimate()
    const usage = estimate.usage ?? 0
    const quota = estimate.quota ?? 0
    return {
      usage,
      quota,
      usagePercent: quota > 0 ? (usage / quota) * 100 : 0,
    }
  } catch {
    return null
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

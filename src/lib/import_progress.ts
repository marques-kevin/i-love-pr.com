export const IMPORT_WRITE_BATCH_SIZE = 250

export type ImportJobStep = 'download' | 'prs' | 'facts'

export function chunk_array<T>(items: T[], batch_size: number): T[][] {
  if (batch_size <= 0) return items.length > 0 ? [items] : []
  const batches: T[][] = []
  for (let index = 0; index < items.length; index += batch_size) {
    batches.push(items.slice(index, index + batch_size))
  }
  return batches
}

export function download_import_percent(bytes_read: number, content_length: number | null): number {
  if (content_length && content_length > 0) {
    return Math.min(30, Math.round((bytes_read / content_length) * 30))
  }
  return 15
}

export function write_import_percent(written: number, total: number): number {
  if (total <= 0) return 55
  return 30 + Math.round((written / total) * 50)
}

export function facts_import_percent(complete: boolean): number {
  return complete ? 100 : 85
}

export async function yield_to_main(): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0)
  })
}

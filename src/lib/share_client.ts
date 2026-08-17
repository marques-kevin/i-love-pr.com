import { parse_repo_snapshot, type RepoSnapshotV1 } from '@/lib/repo_snapshot'

export type ShareUploadUrls = {
  share_id: string
  upload_url: string
  download_url: string
  expires_at: string
}

const SHARE_API_BASE =
  (import.meta.env.VITE_SHARE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api/share'

function share_api_url(path: string): string {
  return `${SHARE_API_BASE}${path}`
}

export async function request_share_upload_urls(): Promise<ShareUploadUrls> {
  const response = await fetch(share_api_url('/upload-url'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Share API failed (${response.status})`)
  }
  const payload = (await response.json()) as ShareUploadUrls
  if (!payload.share_id || !payload.upload_url || !payload.download_url) {
    throw new Error('Share API returned an invalid payload')
  }
  return payload
}

export async function upload_share_snapshot(
  upload_url: string,
  snapshot: RepoSnapshotV1,
): Promise<void> {
  const response = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(snapshot),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Upload failed (${response.status})`)
  }
}

export async function fetch_share_snapshot(download_url: string): Promise<RepoSnapshotV1> {
  const response = await fetch(download_url)
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Download failed (${response.status})`)
  }
  const raw = await response.text()
  return parse_repo_snapshot(raw)
}

export function build_share_page_url(share_id: string): string {
  const url = new URL(window.location.origin)
  url.searchParams.set('import', share_id)
  return url.toString()
}

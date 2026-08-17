import {
  is_boolean_value,
  is_json_object,
  is_number_value,
  is_string_value,
  json_string_field,
} from '@/lib/boundary_parse'
import type { ExternalValue, JsonValue } from '@/lib/json_value'
import { parse_repo_snapshot, type RepoSnapshotV1 } from '@/lib/repo_snapshot'

export type ShareUploadUrls = {
  share_id: string
  upload_url: string
  download_url: string
  expires_at: string
}

function read_share_api_base(): string {
  const configured = import.meta.env.VITE_SHARE_API_URL
  if (configured === undefined || configured === null || configured === '') {
    return '/api/share'
  }
  if (!is_string_value(configured)) {
    return '/api/share'
  }
  return configured.replace(/\/$/, '')
}

function share_api_url(path: string): string {
  return `${read_share_api_base()}${path}`
}

function decode_response_json(decoded: unknown): JsonValue {
  // SAFETY: fetch JSON is normalized into a JsonValue tree before field validation.
  return decode_external_value(decoded as ExternalValue)
}

function decode_external_value(value: ExternalValue): JsonValue {
  if (value === null) return null
  if (is_string_value(value) || is_number_value(value) || is_boolean_value(value)) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => decode_external_value(item))
  }
  if (is_json_object(value)) return value
  throw new Error('Share API returned an invalid payload')
}

function parse_share_upload_urls(value: JsonValue): ShareUploadUrls {
  if (!is_json_object(value)) {
    throw new Error('Share API returned an invalid payload')
  }
  const share_id = json_string_field(value, 'share_id', 'shareId')
  const upload_url = json_string_field(value, 'upload_url', 'uploadUrl')
  const download_url = json_string_field(value, 'download_url', 'downloadUrl')
  const expires_at = json_string_field(value, 'expires_at', 'expiresAt')
  if (!share_id || !upload_url || !download_url || !expires_at) {
    throw new Error('Share API returned an invalid payload')
  }
  return { share_id, upload_url, download_url, expires_at }
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
  const payload = parse_share_upload_urls(decode_response_json(await response.json()))
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

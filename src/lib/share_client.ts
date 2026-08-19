import {
  is_boolean_value,
  is_json_object,
  is_number_value,
  is_string_value,
  json_string_field,
} from '@/lib/boundary_parse'
import type { ExternalValue, JsonObject, JsonValue } from '@/lib/json_value'
import { parse_repo_snapshot, type RepoSnapshotV1 } from '@/lib/repo_snapshot'
import {
  is_worker_share_upload_url,
  read_client_upload_secret,
  SHARE_UPLOAD_SECRET_HEADER,
} from '@/lib/share_upload_auth'

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

function decode_external_value(value: ExternalValue): JsonValue {
  if (value === null) return null
  if (is_string_value(value) || is_number_value(value) || is_boolean_value(value)) {
    return value
  }
  if (Array.isArray(value)) {
    return value.map((item) => decode_external_value(item))
  }
  if (is_json_object(value)) {
    const decoded: JsonObject = {}
    for (const [key, entry] of Object.entries(value)) {
      decoded[key] = decode_external_value(entry)
    }
    return decoded
  }
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

function client_upload_secret(): string {
  return read_client_upload_secret(import.meta.env.VITE_SHARE_UPLOAD_SECRET)
}

export type ShareSnapshotPayload = {
  body: string
  byte_length: number
}

export function encode_share_snapshot(snapshot: RepoSnapshotV1): ShareSnapshotPayload {
  const body = JSON.stringify(snapshot)
  return { body, byte_length: new TextEncoder().encode(body).byteLength }
}

export async function request_share_upload_urls(content_length: number): Promise<ShareUploadUrls> {
  const response = await fetch(share_api_url('/upload-url'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [SHARE_UPLOAD_SECRET_HEADER]: client_upload_secret(),
    },
    body: JSON.stringify({ content_length }),
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(detail || `Share API failed (${response.status})`)
  }
  // SAFETY: response.json is normalized through ExternalValue before field validation.
  const decoded = (await response.json()) as ExternalValue
  const payload = parse_share_upload_urls(decode_external_value(decoded))
  return payload
}

export async function upload_share_snapshot(upload_url: string, body: string): Promise<void> {
  const headers = new Headers()
  headers.set('content-type', 'application/json')
  if (is_worker_share_upload_url(upload_url)) {
    headers.set(SHARE_UPLOAD_SECRET_HEADER, client_upload_secret())
  }
  const response = await fetch(upload_url, {
    method: 'PUT',
    headers,
    body,
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

import { is_external_object, is_number_value } from './boundary_parse'
import type { ExternalValue } from './json_value'

export const SHARE_UPLOAD_SECRET_ENV = 'SHARE_UPLOAD_SECRET'
export const SHARE_UPLOAD_SECRET_HEADER = 'x-share-upload-secret'
export const MAX_SHARE_UPLOAD_BYTES = 50 * 1024 * 1024

export type ShareUploadAuthOk = { ok: true }
export type ShareUploadAuthDenied = { ok: false; status: 401 | 403; error: string }
export type ShareUploadAuthResult = ShareUploadAuthOk | ShareUploadAuthDenied

export type ShareUploadSizeOk = { ok: true; byte_length: number }
export type ShareUploadSizeDenied = { ok: false; status: 400 | 413; error: string }
export type ShareUploadSizeResult = ShareUploadSizeOk | ShareUploadSizeDenied

function secrets_equal(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length)
  let mismatch = left.length === right.length ? 0 : 1
  for (let index = 0; index < length; index += 1) {
    const left_code = index < left.length ? left.charCodeAt(index) : 0
    const right_code = index < right.length ? right.charCodeAt(index) : 0
    mismatch |= left_code ^ right_code
  }
  return mismatch === 0
}

export function authorize_share_upload(
  configured_secret: string | undefined,
  provided_secret: string | null,
): ShareUploadAuthResult {
  const expected = configured_secret?.trim() ?? ''
  if (expected.length === 0) {
    return { ok: false, status: 403, error: 'Share uploads are disabled' }
  }
  const provided = provided_secret?.trim() ?? ''
  if (provided.length === 0 || !secrets_equal(expected, provided)) {
    return { ok: false, status: 401, error: 'Unauthorized' }
  }
  return { ok: true }
}

export function read_share_upload_secret(
  header_secret: string | null,
  authorization: string | null,
): string | null {
  const header = header_secret?.trim() ?? ''
  if (header.length > 0) return header
  const auth = authorization?.trim() ?? ''
  if (auth.length < 8) return null
  if (auth.slice(0, 7).toLowerCase() !== 'bearer ') return null
  const token = auth.slice(7).trim()
  return token.length > 0 ? token : null
}

export function assert_share_upload_byte_length(byte_length: number): ShareUploadSizeResult {
  if (!Number.isFinite(byte_length) || !Number.isInteger(byte_length) || byte_length <= 0) {
    return { ok: false, status: 400, error: 'Invalid content length' }
  }
  if (byte_length > MAX_SHARE_UPLOAD_BYTES) {
    return { ok: false, status: 413, error: 'Snapshot too large (max 50 MiB)' }
  }
  return { ok: true, byte_length }
}

export function parse_content_length_header(raw: string | null): ShareUploadSizeResult {
  if (raw === null) {
    return { ok: false, status: 400, error: 'Missing Content-Length' }
  }
  const trimmed = raw.trim()
  if (trimmed.length === 0 || !/^[0-9]+$/.test(trimmed)) {
    return { ok: false, status: 400, error: 'Invalid Content-Length' }
  }
  return assert_share_upload_byte_length(Number(trimmed))
}

export function parse_declared_upload_byte_length(raw_body: string): ShareUploadSizeResult {
  const text = raw_body.trim() === '' ? '{}' : raw_body
  let decoded: ExternalValue
  try {
    // SAFETY: JSON.parse output is treated as ExternalValue; only content_length is read.
    decoded = JSON.parse(text) as ExternalValue
  } catch {
    return { ok: false, status: 400, error: 'Invalid JSON body' }
  }
  if (!is_external_object(decoded)) {
    return { ok: false, status: 400, error: 'Invalid JSON body' }
  }
  const raw = decoded.content_length ?? decoded.contentLength
  if (!is_number_value(raw)) {
    return { ok: false, status: 400, error: 'Missing content_length' }
  }
  return assert_share_upload_byte_length(raw)
}

export function is_worker_share_upload_url(upload_url: string): boolean {
  return upload_url.includes('/api/share/upload/')
}

export function read_client_upload_secret(configured: string | undefined): string {
  if (configured === undefined || configured.trim() === '') {
    throw new Error('Share upload secret is not configured')
  }
  return configured.trim()
}

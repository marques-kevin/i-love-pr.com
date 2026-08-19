import { describe, expect, it } from 'vitest'
import {
  assert_share_upload_byte_length,
  authorize_share_upload,
  is_worker_share_upload_url,
  MAX_SHARE_UPLOAD_BYTES,
  parse_content_length_header,
  parse_declared_upload_byte_length,
  read_client_upload_secret,
  read_share_upload_secret,
  SHARE_UPLOAD_SECRET_ENV,
  SHARE_UPLOAD_SECRET_HEADER,
  share_worker_put_url,
} from '@/lib/share_upload_auth'

describe('authorize_share_upload', () => {
  it('fails closed when the server secret is missing', () => {
    expect(authorize_share_upload(undefined, 'guess')).toEqual({
      ok: false,
      status: 403,
      error: 'Share uploads are disabled',
    })
  })

  it('fails closed when the server secret is blank', () => {
    expect(authorize_share_upload('   ', 'guess')).toEqual({
      ok: false,
      status: 403,
      error: 'Share uploads are disabled',
    })
  })

  it('rejects a missing or wrong client secret', () => {
    expect(authorize_share_upload('s3cret', null)).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
    expect(authorize_share_upload('s3cret', 'nope')).toEqual({
      ok: false,
      status: 401,
      error: 'Unauthorized',
    })
  })

  it('accepts a matching secret', () => {
    expect(authorize_share_upload('s3cret', 's3cret')).toEqual({ ok: true })
    expect(authorize_share_upload(' s3cret ', 's3cret')).toEqual({ ok: true })
  })
})

describe('read_share_upload_secret', () => {
  it('prefers the dedicated header over Authorization', () => {
    expect(read_share_upload_secret('header-secret', 'Bearer other')).toBe('header-secret')
  })

  it('reads a Bearer token', () => {
    expect(read_share_upload_secret(null, 'Bearer token-value')).toBe('token-value')
    expect(read_share_upload_secret(null, 'bearer token-value')).toBe('token-value')
  })

  it('returns null when neither header is present', () => {
    expect(read_share_upload_secret(null, null)).toBeNull()
    expect(read_share_upload_secret('', 'Basic abc')).toBeNull()
  })
})

describe('share upload size cap', () => {
  it('accepts a positive size up to 50 MiB', () => {
    expect(assert_share_upload_byte_length(1)).toEqual({ ok: true, byte_length: 1 })
    expect(assert_share_upload_byte_length(MAX_SHARE_UPLOAD_BYTES)).toEqual({
      ok: true,
      byte_length: MAX_SHARE_UPLOAD_BYTES,
    })
  })

  it('rejects empty or oversized uploads', () => {
    expect(assert_share_upload_byte_length(0)).toEqual({
      ok: false,
      status: 400,
      error: 'Invalid content length',
    })
    expect(assert_share_upload_byte_length(MAX_SHARE_UPLOAD_BYTES + 1)).toEqual({
      ok: false,
      status: 413,
      error: 'Snapshot too large (max 50 MiB)',
    })
  })

  it('parses Content-Length before the body is read', () => {
    expect(parse_content_length_header(null).ok).toBe(false)
    expect(parse_content_length_header('12')).toEqual({ ok: true, byte_length: 12 })
    expect(parse_content_length_header(String(MAX_SHARE_UPLOAD_BYTES + 1))).toEqual({
      ok: false,
      status: 413,
      error: 'Snapshot too large (max 50 MiB)',
    })
  })

  it('requires content_length on the upload-url body', () => {
    expect(parse_declared_upload_byte_length('').ok).toBe(false)
    expect(parse_declared_upload_byte_length('{}').ok).toBe(false)
    expect(parse_declared_upload_byte_length('{"content_length":2048}')).toEqual({
      ok: true,
      byte_length: 2048,
    })
    expect(
      parse_declared_upload_byte_length(`{"content_length":${MAX_SHARE_UPLOAD_BYTES + 1}}`),
    ).toEqual({
      ok: false,
      status: 413,
      error: 'Snapshot too large (max 50 MiB)',
    })
  })
})

describe('share upload helpers', () => {
  it('uses a stable env var and header name', () => {
    expect(SHARE_UPLOAD_SECRET_ENV).toBe('SHARE_UPLOAD_SECRET')
    expect(SHARE_UPLOAD_SECRET_HEADER).toBe('x-share-upload-secret')
  })

  it('always uses the worker PUT URL so size is checked on PUT', () => {
    expect(share_worker_put_url('https://i-love-pr.com', 'abc123')).toBe(
      'https://i-love-pr.com/api/share/upload/abc123',
    )
    expect(
      is_worker_share_upload_url(share_worker_put_url('https://i-love-pr.com/', 'abc123')),
    ).toBe(true)
    expect(is_worker_share_upload_url('https://i-love-pr.com/api/share/upload/abc')).toBe(true)
    expect(
      is_worker_share_upload_url('https://account.r2.cloudflarestorage.com/bucket/shares/abc.json'),
    ).toBe(false)
  })

  it('requires a client secret to be configured', () => {
    expect(() => read_client_upload_secret(undefined)).toThrow(
      'Share upload secret is not configured',
    )
    expect(read_client_upload_secret('  local-dev-secret  ')).toBe('local-dev-secret')
  })
})

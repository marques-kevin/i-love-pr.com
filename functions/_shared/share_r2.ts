import { AwsClient } from 'aws4fetch'
import {
  authorize_share_upload,
  parse_content_length_header,
  parse_declared_upload_byte_length,
  read_share_upload_secret,
  SHARE_UPLOAD_SECRET_HEADER,
  type ShareUploadAuthResult,
  type ShareUploadSizeResult,
} from '../../src/lib/share_upload_auth'

type JsonPrimitive = string | number | boolean | null
type JsonValue = JsonPrimitive | { [key: string]: JsonValue } | JsonValue[]

const UPLOAD_EXPIRES_SECONDS = 60 * 60
const DOWNLOAD_EXPIRES_SECONDS = 60 * 60 * 24 * 7

export type ShareWorkerEnv = {
  SHARE_BUCKET: R2Bucket
  SHARE_UPLOAD_SECRET?: string
  R2_ACCESS_KEY_ID?: string
  R2_SECRET_ACCESS_KEY?: string
  R2_ACCOUNT_ID?: string
  R2_BUCKET_NAME?: string
}

function has_presign_credentials(env: ShareWorkerEnv): boolean {
  return Boolean(
    env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ACCOUNT_ID && env.R2_BUCKET_NAME,
  )
}

function object_key(share_id: string): string {
  return `shares/${share_id}.json`
}

export function create_share_id(): string {
  return crypto.randomUUID().replace(/-/g, '')
}

export function authorize_share_upload_request(
  request: Request,
  env: ShareWorkerEnv,
): ShareUploadAuthResult {
  return authorize_share_upload(
    env.SHARE_UPLOAD_SECRET,
    read_share_upload_secret(
      request.headers.get(SHARE_UPLOAD_SECRET_HEADER),
      request.headers.get('authorization'),
    ),
  )
}

export async function read_declared_upload_size(request: Request): Promise<ShareUploadSizeResult> {
  const raw_body = await request.text()
  return parse_declared_upload_byte_length(raw_body)
}

export function read_put_upload_size(request: Request): ShareUploadSizeResult {
  return parse_content_length_header(request.headers.get('content-length'))
}

export async function create_presigned_put_url(
  env: ShareWorkerEnv,
  share_id: string,
  origin: string,
  content_length: number,
): Promise<string> {
  if (!has_presign_credentials(env)) {
    return `${origin}/api/share/upload/${share_id}`
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  })
  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${object_key(share_id)}`,
  )
  url.searchParams.set('X-Amz-Expires', String(UPLOAD_EXPIRES_SECONDS))
  const signed = await client.sign(
    new Request(url.toString(), {
      method: 'PUT',
      headers: {
        'content-length': String(content_length),
        'content-type': 'application/json',
      },
    }),
    { aws: { signQuery: true } },
  )
  return signed.url
}

export async function create_presigned_get_url(
  env: ShareWorkerEnv,
  share_id: string,
  origin: string,
): Promise<string> {
  if (!has_presign_credentials(env)) {
    return `${origin}/api/share/${share_id}`
  }

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID!,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
  })
  const url = new URL(
    `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_NAME}/${object_key(share_id)}`,
  )
  url.searchParams.set('X-Amz-Expires', String(DOWNLOAD_EXPIRES_SECONDS))
  const signed = await client.sign(new Request(url.toString(), { method: 'GET' }), {
    aws: { signQuery: true },
  })
  return signed.url
}

export async function put_share_object(
  env: ShareWorkerEnv,
  share_id: string,
  body: ArrayBuffer,
): Promise<void> {
  await env.SHARE_BUCKET.put(object_key(share_id), body, {
    httpMetadata: { contentType: 'application/json' },
  })
}

export async function get_share_object(
  env: ShareWorkerEnv,
  share_id: string,
): Promise<R2ObjectBody | null> {
  return env.SHARE_BUCKET.get(object_key(share_id))
}

export function json_response(body: Record<string, JsonValue>, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(init?.headers ?? {}),
    },
  })
}

export function cors_headers(origin: string | null): HeadersInit {
  return {
    'access-control-allow-origin': origin ?? '*',
    'access-control-allow-methods': 'GET, POST, PUT, OPTIONS',
    'access-control-allow-headers': `content-type, ${SHARE_UPLOAD_SECRET_HEADER}, authorization`,
  }
}

export function share_error_response(request: Request, status: number, error: string): Response {
  return json_response({ error }, { status, headers: cors_headers(request.headers.get('origin')) })
}

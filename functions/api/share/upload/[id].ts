import {
  authorize_share_upload_request,
  cors_headers,
  json_response,
  put_share_object,
  read_put_upload_size,
  share_error_response,
  type ShareWorkerEnv,
} from '../../../_shared/share_r2'
import { assert_share_upload_byte_length } from '../../../../src/lib/share_upload_auth'

type PagesContext = {
  request: Request
  env: ShareWorkerEnv
  params: { id?: string }
}

export const onRequestOptions: PagesFunction<ShareWorkerEnv> = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: cors_headers(request.headers.get('origin')),
  })
}

export const onRequestPut: PagesFunction<ShareWorkerEnv> = async (context: PagesContext) => {
  const auth = authorize_share_upload_request(context.request, context.env)
  if (!auth.ok) {
    return share_error_response(context.request, auth.status, auth.error)
  }

  const share_id = context.params.id?.trim()
  if (!share_id) {
    return share_error_response(context.request, 400, 'Missing share id')
  }

  const declared_size = read_put_upload_size(context.request)
  if (!declared_size.ok) {
    return share_error_response(context.request, declared_size.status, declared_size.error)
  }

  const body = await context.request.arrayBuffer()
  // Authoritative cap: actual PUT body, not mint-time content_length or R2 metadata.
  const actual_size = assert_share_upload_byte_length(body.byteLength)
  if (!actual_size.ok) {
    return share_error_response(context.request, actual_size.status, actual_size.error)
  }

  await put_share_object(context.env, share_id, body)
  return json_response(
    { ok: true },
    { headers: cors_headers(context.request.headers.get('origin')) },
  )
}

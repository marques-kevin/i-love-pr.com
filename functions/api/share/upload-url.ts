import {
  authorize_share_upload_request,
  cors_headers,
  create_presigned_get_url,
  create_presigned_put_url,
  create_share_id,
  json_response,
  read_declared_upload_size,
  share_error_response,
  type ShareWorkerEnv,
} from '../../_shared/share_r2'

type PagesContext = {
  request: Request
  env: ShareWorkerEnv
}

export const onRequestOptions: PagesFunction<ShareWorkerEnv> = async ({ request }) => {
  return new Response(null, {
    status: 204,
    headers: cors_headers(request.headers.get('origin')),
  })
}

export const onRequestPost: PagesFunction<ShareWorkerEnv> = async (context: PagesContext) => {
  const auth = authorize_share_upload_request(context.request, context.env)
  if (!auth.ok) {
    return share_error_response(context.request, auth.status, auth.error)
  }

  const declared_size = await read_declared_upload_size(context.request)
  if (!declared_size.ok) {
    return share_error_response(context.request, declared_size.status, declared_size.error)
  }

  const origin = new URL(context.request.url).origin
  const share_id = create_share_id()
  const upload_url = await create_presigned_put_url(
    context.env,
    share_id,
    origin,
    declared_size.byte_length,
  )
  const download_url = await create_presigned_get_url(context.env, share_id, origin)
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  return json_response(
    {
      share_id,
      upload_url,
      download_url,
      expires_at,
    },
    { headers: cors_headers(context.request.headers.get('origin')) },
  )
}

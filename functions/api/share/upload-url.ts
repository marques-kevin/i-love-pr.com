import {
  cors_headers,
  create_presigned_get_url,
  create_presigned_put_url,
  create_share_id,
  json_response,
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
  const origin = new URL(context.request.url).origin
  const share_id = create_share_id()
  const upload_url = await create_presigned_put_url(context.env, share_id, origin)
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

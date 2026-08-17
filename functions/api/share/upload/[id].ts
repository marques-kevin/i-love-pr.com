import {
  cors_headers,
  json_response,
  put_share_object,
  type ShareWorkerEnv,
} from '../../../_shared/share_r2'

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
  const share_id = context.params.id?.trim()
  if (!share_id) {
    return json_response({ error: 'Missing share id' }, { status: 400 })
  }

  const body = await context.request.arrayBuffer()
  if (body.byteLength === 0) {
    return json_response({ error: 'Empty snapshot' }, { status: 400 })
  }
  if (body.byteLength > 50 * 1024 * 1024) {
    return json_response({ error: 'Snapshot too large (max 50 MB)' }, { status: 413 })
  }

  await put_share_object(context.env, share_id, body)
  return json_response(
    { ok: true },
    { headers: cors_headers(context.request.headers.get('origin')) },
  )
}

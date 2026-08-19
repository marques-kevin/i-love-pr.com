import {
  cors_headers,
  get_share_object,
  json_response,
  type ShareWorkerEnv,
} from '../../_shared/share_r2'

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

export const onRequestGet: PagesFunction<ShareWorkerEnv> = async (context: PagesContext) => {
  const share_id = context.params.id?.trim()
  if (!share_id) {
    return json_response({ error: 'Missing share id' }, { status: 400 })
  }

  const object = await get_share_object(context.env, share_id)
  if (!object) {
    return json_response({ error: 'Share not found' }, { status: 404 })
  }

  return new Response(object.body, {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'private, max-age=60',
      ...cors_headers(context.request.headers.get('origin')),
    },
  })
}

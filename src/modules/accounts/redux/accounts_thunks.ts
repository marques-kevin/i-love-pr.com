import { create_app_async_thunk } from '@/store/create_app_async_thunk'

export const logout_account = create_app_async_thunk<void, void>(
  'accounts/logout',
  async (_, { extra }) => {
    await extra.session.logout()
  },
)

export const switch_account = create_app_async_thunk<void, string>(
  'accounts/switch',
  async (login, { extra }) => {
    await extra.session.switch_account(login)
  },
)

export const start_add_account = create_app_async_thunk<void, void>(
  'accounts/start_add',
  async (_, { extra }) => {
    await extra.session.start_add_account()
  },
)

export const cancel_add_account = create_app_async_thunk<void, void>(
  'accounts/cancel_add',
  async (_, { extra }) => {
    await extra.session.cancel_add_account()
  },
)

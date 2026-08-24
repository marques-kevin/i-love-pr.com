import type { AppSettings } from '@/lib/types'

/** Reserved Dexie workspace login for incognito / share-import sessions (no GitHub account). */
export const GUEST_LOGIN = 'guest'

export function should_mount_app_shell(settings: AppSettings | null): boolean {
  if (!settings) return false
  return Boolean(settings.token.trim()) || settings.repos.length > 0
}

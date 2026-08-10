import Dexie, { type EntityTable } from 'dexie'
import type { SavedAccount, SessionRecord } from '@/lib/types'

export class IlovePrMetaDatabase extends Dexie {
  accounts!: EntityTable<SavedAccount, 'login'>
  session!: EntityTable<SessionRecord, 'id'>

  constructor() {
    super('ilovepr-meta')
    this.version(1).stores({
      accounts: 'login, last_used_at',
      session: 'id',
    })
  }
}

let meta_db: IlovePrMetaDatabase | null = null

export function get_meta_db(): IlovePrMetaDatabase {
  if (!meta_db) meta_db = new IlovePrMetaDatabase()
  return meta_db
}

async function ensure_session(db: IlovePrMetaDatabase): Promise<SessionRecord> {
  const existing = await db.session.get('session')
  if (existing) return existing
  const created: SessionRecord = {
    id: 'session',
    active_login: null,
    legacy_migrated: false,
  }
  await db.session.put(created)
  return created
}

export async function list_saved_accounts(): Promise<SavedAccount[]> {
  const db = get_meta_db()
  const accounts = await db.accounts.toArray()
  return accounts.sort((a, b) => b.last_used_at.localeCompare(a.last_used_at))
}

export async function get_saved_account(login: string): Promise<SavedAccount | undefined> {
  return get_meta_db().accounts.get(login)
}

export async function upsert_saved_account(
  account: Omit<SavedAccount, 'last_used_at'> & { last_used_at?: string },
): Promise<SavedAccount> {
  const next: SavedAccount = {
    login: account.login,
    name: account.name,
    email: account.email,
    avatar_url: account.avatar_url,
    token: account.token,
    last_used_at: account.last_used_at ?? new Date().toISOString(),
  }
  await get_meta_db().accounts.put(next)
  return next
}

export async function delete_saved_account(login: string): Promise<void> {
  await get_meta_db().accounts.delete(login)
}

export async function get_active_login(): Promise<string | null> {
  const session = await ensure_session(get_meta_db())
  return session.active_login
}

export async function set_active_login(login: string | null): Promise<void> {
  const db = get_meta_db()
  const session = await ensure_session(db)
  await db.session.put({ ...session, active_login: login })
}

export async function is_legacy_migrated(): Promise<boolean> {
  const session = await ensure_session(get_meta_db())
  return session.legacy_migrated
}

export async function mark_legacy_migrated(): Promise<void> {
  const db = get_meta_db()
  const session = await ensure_session(db)
  await db.session.put({ ...session, legacy_migrated: true })
}

import { useEffect, useState, type FormEvent } from 'react'
import { useIntl } from 'react-intl'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_IGNORED_BOTS } from '@/lib/bots'
import {
  DEFAULT_BUSINESS_HOURS,
  minutesToTimeInput,
  normalizeBusinessHours,
  timeInputToMinutes,
  WEEKDAY_LABELS,
  type BusinessHoursConfig,
} from '@/lib/business-hours'
import { DEFAULT_BACKFILL_LIMIT } from '@/lib/db'
import { estimateStorage, formatBytes } from '@/lib/storage'
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'
import { is_sound_enabled, set_sound_enabled } from '@/lib/cuelume'
import { LocaleSwitcher } from '@/modules/i18n'
import { connector, type ConnectorProps } from './settings.connector'

const COMMON_TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Australia/Sydney',
  'UTC',
]

export function Wrapper({
  settings,
  open,
  active_repo,
  set_show_settings,
  save_settings,
  reset_sync_data,
  clear_all_data,
  load_settings,
  set_bootstrapped,
  refresh_metrics,
  run_sync,
  download_repo_snapshot_file,
  create_repo_share_link,
  import_repo_snapshot_from_link,
  set_active_repo,
}: ConnectorProps) {
  const intl = useIntl()
  const [token, set_token] = useState(settings?.token ?? '')
  const [sync_interval_hours, set_sync_interval_hours] = useState(
    settings?.sync_interval_hours ?? 24,
  )
  const [backfill_limit, set_backfill_limit] = useState(
    settings?.backfill_limit ?? DEFAULT_BACKFILL_LIMIT,
  )
  const [ignored_bots, set_ignored_bots] = useState(
    (settings?.ignored_bots ?? DEFAULT_IGNORED_BOTS).join('\n'),
  )
  const [test_file_globs, set_test_file_globs] = useState(
    (settings?.test_file_globs ?? DEFAULT_TEST_FILE_GLOBS).join('\n'),
  )
  const [business_hours, set_business_hours] = useState<BusinessHoursConfig>(
    normalizeBusinessHours(settings?.business_hours),
  )
  const [storage_info, set_storage_info] = useState<{
    usage: number
    quota: number
    usagePercent: number
  } | null>(null)
  const [message, set_message] = useState<string | null>(null)
  const [busy, set_busy] = useState(false)
  const [sound_enabled, set_sound_enabled_state] = useState(is_sound_enabled)
  const [share_link, set_share_link] = useState<string | null>(null)
  const [import_link, set_import_link] = useState('')
  const [share_busy, set_share_busy] = useState(false)

  const time_zone_options = Array.from(
    new Set([business_hours.time_zone, DEFAULT_BUSINESS_HOURS.time_zone, ...COMMON_TIMEZONES]),
  )

  useEffect(() => {
    if (!open || !settings) return
    set_token(settings.token)
    set_sync_interval_hours(settings.sync_interval_hours)
    set_backfill_limit(settings.backfill_limit ?? DEFAULT_BACKFILL_LIMIT)
    set_ignored_bots(settings.ignored_bots.join('\n'))
    set_test_file_globs(settings.test_file_globs.join('\n'))
    set_business_hours(normalizeBusinessHours(settings.business_hours))
    set_message(null)
    set_share_link(null)
    set_import_link('')
    const params = new URLSearchParams(window.location.search)
    const import_param = params.get('import') ?? params.get('share')
    if (import_param) {
      set_import_link(
        import_param.includes('://')
          ? import_param
          : `${window.location.origin}/?import=${import_param}`,
      )
      params.delete('import')
      params.delete('share')
      const next_search = params.toString()
      const next_url = `${window.location.pathname}${next_search ? `?${next_search}` : ''}${window.location.hash}`
      window.history.replaceState({}, '', next_url)
    }
    void estimateStorage().then(set_storage_info)
  }, [open, settings])

  if (!settings) return null
  const current_settings = settings

  async function handle_save(e: FormEvent) {
    e.preventDefault()
    set_busy(true)
    set_message(null)
    try {
      await save_settings({
        token: token.trim(),
        repos: current_settings.repos,
        sync_interval_hours,
        backfill_limit,
        ignored_bots: ignored_bots
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        test_file_globs: test_file_globs
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        business_hours: normalizeBusinessHours(business_hours),
      })
      void refresh_metrics()
      void run_sync({ force: false })
      set_show_settings(false)
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.save_failed' }),
      )
    } finally {
      set_busy(false)
    }
  }

  async function handle_reset_data() {
    if (!confirm(intl.formatMessage({ id: 'settings.reset_sync_confirm' }))) return
    set_busy(true)
    try {
      await reset_sync_data()
      set_message(intl.formatMessage({ id: 'settings.reset_sync_done' }))
      set_bootstrapped(false)
      set_show_settings(false)
      void load_settings()
    } finally {
      set_busy(false)
    }
  }

  async function handle_factory_reset() {
    if (!confirm(intl.formatMessage({ id: 'settings.clear_all_confirm' }))) return
    set_busy(true)
    try {
      await clear_all_data()
      set_bootstrapped(false)
      set_show_settings(false)
      void load_settings()
    } finally {
      set_busy(false)
    }
  }

  async function handle_download_snapshot() {
    if (!active_repo) return
    set_share_busy(true)
    set_message(null)
    try {
      await download_repo_snapshot_file({ repo_full_name: active_repo })
      set_message(intl.formatMessage({ id: 'settings.share.download_done' }))
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.share.failed' }),
      )
    } finally {
      set_share_busy(false)
    }
  }

  async function handle_create_share_link() {
    if (!active_repo) return
    set_share_busy(true)
    set_message(null)
    try {
      const result = await create_repo_share_link({ repo_full_name: active_repo }).unwrap()
      set_share_link(result.share_url)
      await navigator.clipboard.writeText(result.share_url)
      set_message(
        intl.formatMessage({ id: 'settings.share.link_ready' }, { count: result.pr_count }),
      )
    } catch (err) {
      set_message(
        err instanceof Error ? err.message : intl.formatMessage({ id: 'settings.share.failed' }),
      )
    } finally {
      set_share_busy(false)
    }
  }

  async function handle_import_snapshot() {
    const link = import_link.trim()
    if (!link) return
    set_share_busy(true)
    set_message(null)
    try {
      const result = await import_repo_snapshot_from_link({ share_link: link }).unwrap()
      await set_active_repo(result.repo_full_name)
      set_import_link('')
      set_message(
        intl.formatMessage(
          { id: 'settings.share.import_done' },
          { repo: result.repo_full_name, count: result.pr_count },
        ),
      )
      void refresh_metrics()
      void run_sync({ force: false })
    } catch (err) {
      set_message(
        err instanceof Error
          ? err.message
          : intl.formatMessage({ id: 'settings.share.import_failed' }),
      )
    } finally {
      set_share_busy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={set_show_settings}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {intl.formatMessage({ id: 'settings.title' })}
          </DialogTitle>
          <DialogDescription>
            {intl.formatMessage({ id: 'settings.description' })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handle_save(e)} className="space-y-5">
          <div className="space-y-2">
            <Label>{intl.formatMessage({ id: 'settings.language' })}</Label>
            <LocaleSwitcher />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Label htmlFor="settings-sound">{intl.formatMessage({ id: 'settings.sound' })}</Label>
              <p className="text-xs text-muted-foreground">
                {intl.formatMessage({ id: 'settings.sound_help' })}
              </p>
            </div>
            <Switch
              id="settings-sound"
              checked={sound_enabled}
              onCheckedChange={(enabled) => {
                set_sound_enabled(enabled)
                set_sound_enabled_state(enabled)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-token">{intl.formatMessage({ id: 'settings.token' })}</Label>
            <Input
              id="settings-token"
              type="password"
              value={token}
              onChange={(e) => set_token(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sync-interval">
                {intl.formatMessage({ id: 'settings.sync_interval' })}
              </Label>
              <Input
                id="sync-interval"
                type="number"
                min={1}
                max={168}
                value={sync_interval_hours}
                onChange={(e) => set_sync_interval_hours(Number(e.target.value) || 24)}
              />
              <p className="text-xs text-muted-foreground">
                Auto refresh only if cache is older than this.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="backfill-limit">
                {intl.formatMessage({ id: 'settings.backfill_limit' })}
              </Label>
              <Input
                id="backfill-limit"
                type="number"
                min={25}
                max={5000}
                step={25}
                value={backfill_limit}
                onChange={(e) =>
                  set_backfill_limit(Math.max(25, Number(e.target.value) || DEFAULT_BACKFILL_LIMIT))
                }
              />
              <p className="text-xs text-muted-foreground">
                Each Sync history pulls the next N PRs. Re-run later when the rate limit resets to
                go deeper.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bots">{intl.formatMessage({ id: 'settings.ignored_bots' })}</Label>
            <Textarea
              id="bots"
              rows={5}
              value={ignored_bots}
              onChange={(e) => set_ignored_bots(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => set_ignored_bots(DEFAULT_IGNORED_BOTS.join('\n'))}
            >
              Reset to defaults
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-file-globs">
              {intl.formatMessage({ id: 'settings.test_file_globs' })}
            </Label>
            <p className="text-xs text-muted-foreground">
              {intl.formatMessage({ id: 'settings.test_file_globs_help' })}
            </p>
            <Textarea
              id="test-file-globs"
              rows={5}
              value={test_file_globs}
              onChange={(e) => set_test_file_globs(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => set_test_file_globs(DEFAULT_TEST_FILE_GLOBS.join('\n'))}
            >
              Reset to defaults
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="business-hours">
                  {intl.formatMessage({ id: 'settings.business_hours' })}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {intl.formatMessage({ id: 'settings.business_hours_help' })}
                </p>
              </div>
              <Switch
                id="business-hours"
                checked={business_hours.enabled}
                onCheckedChange={(enabled) => set_business_hours((prev) => ({ ...prev, enabled }))}
              />
            </div>

            {business_hours.enabled && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="bh-tz">{intl.formatMessage({ id: 'settings.timezone' })}</Label>
                  <select
                    id="bh-tz"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={business_hours.time_zone}
                    onChange={(e) =>
                      set_business_hours((prev) => ({
                        ...prev,
                        time_zone: e.target.value,
                      }))
                    }
                  >
                    {time_zone_options.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>{intl.formatMessage({ id: 'settings.workdays' })}</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAY_LABELS.map(({ day, label }) => {
                      const active = business_hours.workdays.includes(day)
                      return (
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={active ? 'default' : 'outline'}
                          className="min-w-12"
                          onClick={() =>
                            set_business_hours((prev) => {
                              const set = new Set(prev.workdays)
                              if (set.has(day)) set.delete(day)
                              else set.add(day)
                              return { ...prev, workdays: [...set].sort() }
                            })
                          }
                        >
                          {label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bh-start">{intl.formatMessage({ id: 'settings.start' })}</Label>
                    <Input
                      id="bh-start"
                      type="time"
                      value={minutesToTimeInput(business_hours.start_minutes)}
                      onChange={(e) =>
                        set_business_hours((prev) => ({
                          ...prev,
                          start_minutes: timeInputToMinutes(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bh-end">{intl.formatMessage({ id: 'settings.end' })}</Label>
                    <Input
                      id="bh-end"
                      type="time"
                      value={minutesToTimeInput(business_hours.end_minutes)}
                      onChange={(e) =>
                        set_business_hours((prev) => ({
                          ...prev,
                          end_minutes: timeInputToMinutes(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div>
              <p className="font-medium text-foreground">
                {intl.formatMessage({ id: 'settings.share.title' })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {intl.formatMessage({ id: 'settings.share.description' })}
              </p>
            </div>

            {active_repo ? (
              <p className="text-sm">
                {intl.formatMessage({ id: 'settings.share.active_repo' }, { repo: active_repo })}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {intl.formatMessage({ id: 'settings.share.no_active_repo' })}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={share_busy || !active_repo}
                onClick={() => void handle_download_snapshot()}
              >
                {intl.formatMessage({ id: 'settings.share.download' })}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={share_busy || !active_repo}
                onClick={() => void handle_create_share_link()}
              >
                {share_busy
                  ? intl.formatMessage({ id: 'settings.share.working' })
                  : intl.formatMessage({ id: 'settings.share.create_link' })}
              </Button>
            </div>

            {share_link && (
              <div className="space-y-1">
                <Label htmlFor="settings-share-link">
                  {intl.formatMessage({ id: 'settings.share.link_label' })}
                </Label>
                <Input
                  id="settings-share-link"
                  readOnly
                  value={share_link}
                  className="font-mono text-xs"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="settings-import-link">
                {intl.formatMessage({ id: 'settings.share.import_label' })}
              </Label>
              <Input
                id="settings-import-link"
                value={import_link}
                onChange={(e) => set_import_link(e.target.value)}
                placeholder={intl.formatMessage({ id: 'settings.share.import_placeholder' })}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={share_busy || import_link.trim().length === 0}
                onClick={() => void handle_import_snapshot()}
              >
                {intl.formatMessage({ id: 'settings.share.import' })}
              </Button>
            </div>
          </div>

          <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {intl.formatMessage({ id: 'settings.storage' })}
            </p>
            {storage_info ? (
              <p className="mt-1">
                {formatBytes(storage_info.usage)} used of {formatBytes(storage_info.quota)} (
                {storage_info.usagePercent.toFixed(2)}%)
              </p>
            ) : (
              <p className="mt-1">Storage estimate unavailable in this browser.</p>
            )}
          </div>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Separator />

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => void handle_reset_data()}
              >
                {intl.formatMessage({ id: 'settings.reset_sync' })}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void handle_factory_reset()}
              >
                {intl.formatMessage({ id: 'settings.clear_all' })}
              </Button>
            </div>
            <Button type="submit" disabled={busy || current_settings.repos.length === 0}>
              {busy
                ? intl.formatMessage({ id: 'settings.saving' })
                : intl.formatMessage({ id: 'settings.save' })}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const Settings = connector(Wrapper)

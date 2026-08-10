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
import { RepoPicker } from '@/components/repo_picker'
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
  available_repos,
  available_repos_loading,
  available_repos_error,
  set_show_settings,
  save_settings,
  reset_sync_data,
  clear_all_data,
  load_settings,
  load_available_repos,
  set_bootstrapped,
  refresh_metrics,
  run_sync,
}: ConnectorProps) {
  const intl = useIntl()
  const [token, set_token] = useState(settings?.token ?? '')
  const [repos, set_repos] = useState(settings?.repos ?? [])
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

  const time_zone_options = Array.from(
    new Set([business_hours.time_zone, DEFAULT_BUSINESS_HOURS.time_zone, ...COMMON_TIMEZONES]),
  )

  useEffect(() => {
    if (!open || !settings) return
    set_token(settings.token)
    set_repos(settings.repos)
    set_sync_interval_hours(settings.sync_interval_hours)
    set_backfill_limit(settings.backfill_limit ?? DEFAULT_BACKFILL_LIMIT)
    set_ignored_bots(settings.ignored_bots.join('\n'))
    set_test_file_globs(settings.test_file_globs.join('\n'))
    set_business_hours(normalizeBusinessHours(settings.business_hours))
    set_message(null)
    void estimateStorage().then(set_storage_info)
  }, [open, settings])

  useEffect(() => {
    if (!available_repos_error) return
    set_message(available_repos_error)
  }, [available_repos_error])

  if (!settings) return null

  async function handle_save(e: FormEvent) {
    e.preventDefault()
    set_busy(true)
    set_message(null)
    try {
      await save_settings({
        token: token.trim(),
        repos,
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

          <div className="space-y-2">
            <Label htmlFor="settings-token">{intl.formatMessage({ id: 'settings.token' })}</Label>
            <Input
              id="settings-token"
              type="password"
              value={token}
              onChange={(e) => set_token(e.target.value)}
              onBlur={() => {
                const next = token.trim()
                if (!next || next === settings.token) return
                void load_available_repos({ token: next, force: true })
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>{intl.formatMessage({ id: 'settings.repos' })}</Label>
            <RepoPicker
              id="settings-repo"
              availableRepos={available_repos}
              selected={repos}
              onChange={set_repos}
              token={token}
              loading={available_repos_loading}
              disabled={!token.trim()}
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
            <Button type="submit" disabled={busy || repos.length === 0}>
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

import { useEffect, useState, type FormEvent } from 'react'
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
  const [token, set_token] = useState(settings?.token ?? '')
  const [repos, set_repos] = useState(settings?.repos ?? [])
  const [sync_interval_hours, set_sync_interval_hours] = useState(settings?.syncIntervalHours ?? 24)
  const [backfill_limit, set_backfill_limit] = useState(
    settings?.backfillLimit ?? DEFAULT_BACKFILL_LIMIT,
  )
  const [ignored_bots, set_ignored_bots] = useState(
    (settings?.ignoredBots ?? DEFAULT_IGNORED_BOTS).join('\n'),
  )
  const [business_hours, set_business_hours] = useState<BusinessHoursConfig>(
    normalizeBusinessHours(settings?.businessHours),
  )
  const [storage_info, set_storage_info] = useState<{
    usage: number
    quota: number
    usagePercent: number
  } | null>(null)
  const [message, set_message] = useState<string | null>(null)
  const [busy, set_busy] = useState(false)

  const time_zone_options = Array.from(
    new Set([business_hours.timeZone, DEFAULT_BUSINESS_HOURS.timeZone, ...COMMON_TIMEZONES]),
  )

  useEffect(() => {
    if (!open || !settings) return
    set_token(settings.token)
    set_repos(settings.repos)
    set_sync_interval_hours(settings.syncIntervalHours)
    set_backfill_limit(settings.backfillLimit ?? DEFAULT_BACKFILL_LIMIT)
    set_ignored_bots(settings.ignoredBots.join('\n'))
    set_business_hours(normalizeBusinessHours(settings.businessHours))
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
        syncIntervalHours: sync_interval_hours,
        backfillLimit: backfill_limit,
        ignoredBots: ignored_bots
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        businessHours: normalizeBusinessHours(business_hours),
      })
      void refresh_metrics()
      void run_sync({ force: false })
      set_show_settings(false)
    } catch (err) {
      set_message(err instanceof Error ? err.message : 'Save failed')
    } finally {
      set_busy(false)
    }
  }

  async function handle_reset_data() {
    if (!confirm('Clear all PR/review data and re-run a full backfill?')) return
    set_busy(true)
    try {
      await reset_sync_data()
      set_message('Local PR data cleared. Sync will backfill on next refresh.')
      set_bootstrapped(false)
      set_show_settings(false)
      void load_settings()
    } finally {
      set_busy(false)
    }
  }

  async function handle_factory_reset() {
    if (!confirm('Erase ALL local data including token and settings?')) return
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
          <DialogTitle className="font-display text-xl">Settings</DialogTitle>
          <DialogDescription>
            Token and data stay in this browser. Nothing is sent to a backend.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handle_save(e)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="settings-token">GitHub token</Label>
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

          <RepoPicker
            id="settings-repo"
            availableRepos={available_repos}
            selected={repos}
            onChange={set_repos}
            token={token}
            loading={available_repos_loading}
            disabled={!token.trim()}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Sync interval (hours)</Label>
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
              <Label htmlFor="backfill-limit">PRs per sync batch</Label>
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
            <Label htmlFor="bots">Ignored bot logins</Label>
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

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="business-hours">Business hours</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cycle time, time to first review, and request→approve count only working windows.
                  No re-sync needed.
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
                  <Label htmlFor="bh-tz">Timezone</Label>
                  <select
                    id="bh-tz"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={business_hours.timeZone}
                    onChange={(e) =>
                      set_business_hours((prev) => ({
                        ...prev,
                        timeZone: e.target.value,
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
                  <Label>Working days</Label>
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
                    <Label htmlFor="bh-start">Start</Label>
                    <Input
                      id="bh-start"
                      type="time"
                      value={minutesToTimeInput(business_hours.startMinutes)}
                      onChange={(e) =>
                        set_business_hours((prev) => ({
                          ...prev,
                          startMinutes: timeInputToMinutes(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bh-end">End</Label>
                    <Input
                      id="bh-end"
                      type="time"
                      value={minutesToTimeInput(business_hours.endMinutes)}
                      onChange={(e) =>
                        set_business_hours((prev) => ({
                          ...prev,
                          endMinutes: timeInputToMinutes(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Local storage</p>
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
                Reset local data
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void handle_factory_reset()}
              >
                Factory reset
              </Button>
            </div>
            <Button type="submit" disabled={busy || repos.length === 0}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const Settings = connector(Wrapper)

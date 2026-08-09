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
import { RepoPicker } from '@/components/RepoPicker'
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
import { GitHubClient, type GitHubRepoOption } from '@/lib/github-client'
import { estimateStorage, formatBytes } from '@/lib/storage'
import type { AppSettings } from '@/lib/types'

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

interface SettingsProps {
  settings: AppSettings
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: {
    token: string
    repos: string[]
    syncIntervalHours: number
    backfillLimit: number
    ignoredBots: string[]
    businessHours: BusinessHoursConfig
  }) => Promise<void>
  onResetData: () => Promise<void>
  onFactoryReset: () => Promise<void>
  onResetComplete: () => void
}

export function Settings({
  settings,
  open,
  onOpenChange,
  onSave,
  onResetData,
  onFactoryReset,
  onResetComplete,
}: SettingsProps) {
  const [token, setToken] = useState(settings.token)
  const [repos, setRepos] = useState(settings.repos)
  const [availableRepos, setAvailableRepos] = useState<GitHubRepoOption[]>([])
  const [loadingRepos, setLoadingRepos] = useState(false)
  const [syncIntervalHours, setSyncIntervalHours] = useState(settings.syncIntervalHours)
  const [backfillLimit, setBackfillLimit] = useState(
    settings.backfillLimit ?? DEFAULT_BACKFILL_LIMIT,
  )
  const [ignoredBots, setIgnoredBots] = useState(settings.ignoredBots.join('\n'))
  const [businessHours, setBusinessHours] = useState<BusinessHoursConfig>(
    normalizeBusinessHours(settings.businessHours),
  )
  const [storageInfo, setStorageInfo] = useState<{
    usage: number
    quota: number
    usagePercent: number
  } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const timeZoneOptions = Array.from(
    new Set([
      businessHours.timeZone,
      DEFAULT_BUSINESS_HOURS.timeZone,
      ...COMMON_TIMEZONES,
    ]),
  )

  useEffect(() => {
    if (!open) return
    setToken(settings.token)
    setRepos(settings.repos)
    setSyncIntervalHours(settings.syncIntervalHours)
    setBackfillLimit(settings.backfillLimit ?? DEFAULT_BACKFILL_LIMIT)
    setIgnoredBots(settings.ignoredBots.join('\n'))
    setBusinessHours(normalizeBusinessHours(settings.businessHours))
    setMessage(null)
    void estimateStorage().then(setStorageInfo)
    void loadRepos(settings.token)
  }, [open, settings])

  async function loadRepos(pat: string) {
    if (!pat.trim()) {
      setAvailableRepos([])
      return
    }
    setLoadingRepos(true)
    try {
      const client = new GitHubClient(pat.trim())
      const listed = await client.listRepositories()
      setAvailableRepos(listed.repos)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to load repositories')
      setAvailableRepos([])
    } finally {
      setLoadingRepos(false)
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await onSave({
        token: token.trim(),
        repos,
        syncIntervalHours,
        backfillLimit,
        ignoredBots: ignoredBots
          .split(/[\n,]/)
          .map((s) => s.trim())
          .filter(Boolean),
        businessHours: normalizeBusinessHours(businessHours),
      })
      onOpenChange(false)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleResetData() {
    if (!confirm('Clear all PR/review data and re-run a full backfill?')) return
    setBusy(true)
    try {
      await onResetData()
      setMessage('Local PR data cleared. Sync will backfill on next refresh.')
      onResetComplete()
    } finally {
      setBusy(false)
    }
  }

  async function handleFactoryReset() {
    if (!confirm('Erase ALL local data including token and settings?')) return
    setBusy(true)
    try {
      await onFactoryReset()
      onResetComplete()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Settings</DialogTitle>
          <DialogDescription>
            Token and data stay in this browser. Nothing is sent to a backend.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSave(e)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="settings-token">GitHub token</Label>
            <Input
              id="settings-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onBlur={() => void loadRepos(token)}
            />
          </div>

          <RepoPicker
            id="settings-repo"
            availableRepos={availableRepos}
            selected={repos}
            onChange={setRepos}
            token={token}
            loading={loadingRepos}
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
                value={syncIntervalHours}
                onChange={(e) => setSyncIntervalHours(Number(e.target.value) || 24)}
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
                value={backfillLimit}
                onChange={(e) =>
                  setBackfillLimit(Math.max(25, Number(e.target.value) || DEFAULT_BACKFILL_LIMIT))
                }
              />
              <p className="text-xs text-muted-foreground">
                Each Sync history pulls the next N PRs. Re-run later when the rate
                limit resets to go deeper.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bots">Ignored bot logins</Label>
            <Textarea
              id="bots"
              rows={5}
              value={ignoredBots}
              onChange={(e) => setIgnoredBots(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => setIgnoredBots(DEFAULT_IGNORED_BOTS.join('\n'))}
            >
              Reset to defaults
            </Button>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="business-hours">Business hours</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cycle time, time to first review, and request→approve count only
                  working windows. No re-sync needed.
                </p>
              </div>
              <Switch
                id="business-hours"
                checked={businessHours.enabled}
                onCheckedChange={(enabled) =>
                  setBusinessHours((prev) => ({ ...prev, enabled }))
                }
              />
            </div>

            {businessHours.enabled && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <Label htmlFor="bh-tz">Timezone</Label>
                  <select
                    id="bh-tz"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={businessHours.timeZone}
                    onChange={(e) =>
                      setBusinessHours((prev) => ({
                        ...prev,
                        timeZone: e.target.value,
                      }))
                    }
                  >
                    {timeZoneOptions.map((tz) => (
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
                      const active = businessHours.workdays.includes(day)
                      return (
                        <Button
                          key={day}
                          type="button"
                          size="sm"
                          variant={active ? 'default' : 'outline'}
                          className="min-w-12"
                          onClick={() =>
                            setBusinessHours((prev) => {
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
                      value={minutesToTimeInput(businessHours.startMinutes)}
                      onChange={(e) =>
                        setBusinessHours((prev) => ({
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
                      value={minutesToTimeInput(businessHours.endMinutes)}
                      onChange={(e) =>
                        setBusinessHours((prev) => ({
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
            {storageInfo ? (
              <p className="mt-1">
                {formatBytes(storageInfo.usage)} used of {formatBytes(storageInfo.quota)} (
                {storageInfo.usagePercent.toFixed(2)}%)
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
                onClick={() => void handleResetData()}
              >
                Reset local data
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => void handleFactoryReset()}
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

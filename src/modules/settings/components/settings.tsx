import { useEffect, useState, type FormEvent } from 'react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
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
  set_show_settings,
  save_settings,
  reset_sync_data,
  clear_all_data,
  load_settings,
  set_bootstrapped,
  refresh_metrics,
  run_sync,
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

  return (
    <Modal
      open={open}
      on_close={() => set_show_settings(false)}
      box_className="max-h-[90vh] max-w-xl overflow-y-auto"
    >
      <h3 className="font-display text-xl font-semibold">
        {intl.formatMessage({ id: 'settings.title' })}
      </h3>
      <p className="text-base-content/60 mt-1 text-sm">
        {intl.formatMessage({ id: 'settings.description' })}
      </p>

      <form onSubmit={(e) => void handle_save(e)} className="mt-5 space-y-5">
        <div className="space-y-2">
          <span className="label">{intl.formatMessage({ id: 'settings.language' })}</span>
          <LocaleSwitcher />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor="settings-sound" className="label">
              {intl.formatMessage({ id: 'settings.sound' })}
            </label>
            <p className="text-base-content/60 text-xs">
              {intl.formatMessage({ id: 'settings.sound_help' })}
            </p>
          </div>
          <input
            id="settings-sound"
            type="checkbox"
            className="toggle toggle-primary"
            checked={sound_enabled}
            onChange={(event) => {
              set_sound_enabled(event.target.checked)
              set_sound_enabled_state(event.target.checked)
            }}
          />
        </div>

        <label className="form-control w-full">
          <span className="label">{intl.formatMessage({ id: 'settings.token' })}</span>
          <Input
            id="settings-token"
            type="password"
            value={token}
            onChange={(e) => set_token(e.target.value)}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-control w-full">
            <span className="label">{intl.formatMessage({ id: 'settings.sync_interval' })}</span>
            <Input
              id="sync-interval"
              type="number"
              min={1}
              max={168}
              value={sync_interval_hours}
              onChange={(e) => set_sync_interval_hours(Number(e.target.value) || 24)}
            />
            <span className="text-base-content/60 mt-1 text-xs">
              Auto refresh only if cache is older than this.
            </span>
          </label>
          <label className="form-control w-full">
            <span className="label">{intl.formatMessage({ id: 'settings.backfill_limit' })}</span>
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
            <span className="text-base-content/60 mt-1 text-xs">
              Each Sync history pulls the next N PRs. Re-run later when the rate limit resets to go
              deeper.
            </span>
          </label>
        </div>

        <div className="space-y-2">
          <label htmlFor="bots" className="label">
            {intl.formatMessage({ id: 'settings.ignored_bots' })}
          </label>
          <Textarea
            id="bots"
            rows={5}
            value={ignored_bots}
            onChange={(e) => set_ignored_bots(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            className="btn-link h-auto min-h-0 p-0"
            onClick={() => set_ignored_bots(DEFAULT_IGNORED_BOTS.join('\n'))}
          >
            Reset to defaults
          </Button>
        </div>

        <div className="space-y-2">
          <label htmlFor="test-file-globs" className="label">
            {intl.formatMessage({ id: 'settings.test_file_globs' })}
          </label>
          <p className="text-base-content/60 text-xs">
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
            className="btn-link h-auto min-h-0 p-0"
            onClick={() => set_test_file_globs(DEFAULT_TEST_FILE_GLOBS.join('\n'))}
          >
            Reset to defaults
          </Button>
        </div>

        <div className="space-y-3 rounded-xl border border-base-300 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <label htmlFor="business-hours" className="label">
                {intl.formatMessage({ id: 'settings.business_hours' })}
              </label>
              <p className="text-base-content/60 mt-1 text-xs">
                {intl.formatMessage({ id: 'settings.business_hours_help' })}
              </p>
            </div>
            <input
              id="business-hours"
              type="checkbox"
              className="toggle toggle-primary"
              checked={business_hours.enabled}
              onChange={(event) =>
                set_business_hours((prev) => ({ ...prev, enabled: event.target.checked }))
              }
            />
          </div>

          {business_hours.enabled && (
            <div className="space-y-4 pt-1">
              <label className="form-control w-full">
                <span className="label">{intl.formatMessage({ id: 'settings.timezone' })}</span>
                <select
                  id="bh-tz"
                  className="select w-full"
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
              </label>

              <div className="space-y-2">
                <span className="label">{intl.formatMessage({ id: 'settings.workdays' })}</span>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map(({ day, label }) => {
                    const active = business_hours.workdays.includes(day)
                    return (
                      <Button
                        key={day}
                        type="button"
                        className={
                          active ? 'btn-primary btn-sm min-w-12' : 'btn-outline btn-sm min-w-12'
                        }
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
                <label className="form-control w-full">
                  <span className="label">{intl.formatMessage({ id: 'settings.start' })}</span>
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
                </label>
                <label className="form-control w-full">
                  <span className="label">{intl.formatMessage({ id: 'settings.end' })}</span>
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
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-base-200 text-base-content/60 rounded-xl p-4 text-sm">
          <p className="font-medium text-base-content">
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

        {message ? (
          <div role="alert" className="alert">
            <span>{message}</span>
          </div>
        ) : null}

        <div className="divider" />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="btn-outline"
              disabled={busy}
              onClick={() => void handle_reset_data()}
            >
              {intl.formatMessage({ id: 'settings.reset_sync' })}
            </Button>
            <Button
              type="button"
              className="btn-error"
              disabled={busy}
              onClick={() => void handle_factory_reset()}
            >
              {intl.formatMessage({ id: 'settings.clear_all' })}
            </Button>
          </div>
          <Button
            type="submit"
            className="btn-primary"
            disabled={busy || current_settings.repos.length === 0}
          >
            {busy
              ? intl.formatMessage({ id: 'settings.saving' })
              : intl.formatMessage({ id: 'settings.save' })}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export const Settings = connector(Wrapper)

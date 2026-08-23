import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { DEFAULT_TEST_FILE_GLOBS } from '@/lib/test_file_patterns'

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

export type RepoSettingsFormValues = {
  ignored_bots: string
  test_file_globs: string
  business_hours: BusinessHoursConfig
}

export type RepoSettingsFormProps = {
  values: RepoSettingsFormValues
  on_change: (values: RepoSettingsFormValues) => void
  id_prefix?: string
}

export function RepoSettingsForm({ values, on_change, id_prefix = 'repo' }: RepoSettingsFormProps) {
  const intl = useIntl()
  const { ignored_bots, test_file_globs, business_hours } = values

  const time_zone_options = Array.from(
    new Set([business_hours.time_zone, DEFAULT_BUSINESS_HOURS.time_zone, ...COMMON_TIMEZONES]),
  )

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor={`${id_prefix}-bots`} className="label">
          {intl.formatMessage({ id: 'settings.ignored_bots' })}
        </label>
        <Textarea
          id={`${id_prefix}-bots`}
          rows={5}
          value={ignored_bots}
          onChange={(e) => on_change({ ...values, ignored_bots: e.target.value })}
          className="font-mono text-sm"
        />
        <Button
          type="button"
          className="btn-link h-auto min-h-0 p-0"
          onClick={() => on_change({ ...values, ignored_bots: DEFAULT_IGNORED_BOTS.join('\n') })}
        >
          {intl.formatMessage({ id: 'repo_settings.reset_defaults' })}
        </Button>
      </div>

      <div className="space-y-2">
        <label htmlFor={`${id_prefix}-test-file-globs`} className="label">
          {intl.formatMessage({ id: 'settings.test_file_globs' })}
        </label>
        <p className="text-base-content/60 text-xs">
          {intl.formatMessage({ id: 'settings.test_file_globs_help' })}
        </p>
        <Textarea
          id={`${id_prefix}-test-file-globs`}
          rows={5}
          value={test_file_globs}
          onChange={(e) => on_change({ ...values, test_file_globs: e.target.value })}
          className="font-mono text-sm"
        />
        <Button
          type="button"
          className="btn-link h-auto min-h-0 p-0"
          onClick={() =>
            on_change({ ...values, test_file_globs: DEFAULT_TEST_FILE_GLOBS.join('\n') })
          }
        >
          {intl.formatMessage({ id: 'repo_settings.reset_defaults' })}
        </Button>
      </div>

      <div className="space-y-3 rounded-xl border border-base-300 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <label htmlFor={`${id_prefix}-business-hours`} className="label">
              {intl.formatMessage({ id: 'settings.business_hours' })}
            </label>
            <p className="text-base-content/60 mt-1 text-xs">
              {intl.formatMessage({ id: 'settings.business_hours_help' })}
            </p>
          </div>
          <input
            id={`${id_prefix}-business-hours`}
            type="checkbox"
            className="toggle toggle-primary"
            checked={business_hours.enabled}
            onChange={(event) =>
              on_change({
                ...values,
                business_hours: { ...business_hours, enabled: event.target.checked },
              })
            }
          />
        </div>

        {business_hours.enabled && (
          <div className="space-y-4 pt-1">
            <label className="form-control w-full">
              <span className="label">{intl.formatMessage({ id: 'settings.timezone' })}</span>
              <select
                id={`${id_prefix}-bh-tz`}
                className="select w-full"
                value={business_hours.time_zone}
                onChange={(e) =>
                  on_change({
                    ...values,
                    business_hours: { ...business_hours, time_zone: e.target.value },
                  })
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
                        on_change({
                          ...values,
                          business_hours: {
                            ...business_hours,
                            workdays: (() => {
                              const set = new Set(business_hours.workdays)
                              if (set.has(day)) set.delete(day)
                              else set.add(day)
                              return [...set].sort()
                            })(),
                          },
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
                  id={`${id_prefix}-bh-start`}
                  type="time"
                  value={minutesToTimeInput(business_hours.start_minutes)}
                  onChange={(e) =>
                    on_change({
                      ...values,
                      business_hours: {
                        ...business_hours,
                        start_minutes: timeInputToMinutes(e.target.value),
                      },
                    })
                  }
                />
              </label>
              <label className="form-control w-full">
                <span className="label">{intl.formatMessage({ id: 'settings.end' })}</span>
                <Input
                  id={`${id_prefix}-bh-end`}
                  type="time"
                  value={minutesToTimeInput(business_hours.end_minutes)}
                  onChange={(e) =>
                    on_change({
                      ...values,
                      business_hours: {
                        ...business_hours,
                        end_minutes: timeInputToMinutes(e.target.value),
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function repo_settings_to_form_values(settings: {
  ignored_bots: string[]
  test_file_globs: string[]
  business_hours: BusinessHoursConfig
}): RepoSettingsFormValues {
  return {
    ignored_bots: settings.ignored_bots.join('\n'),
    test_file_globs: settings.test_file_globs.join('\n'),
    business_hours: normalizeBusinessHours(settings.business_hours),
  }
}

export function form_values_to_repo_settings_payload(values: RepoSettingsFormValues) {
  return {
    ignored_bots: values.ignored_bots
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    test_file_globs: values.test_file_globs
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean),
    business_hours: normalizeBusinessHours(values.business_hours),
  }
}

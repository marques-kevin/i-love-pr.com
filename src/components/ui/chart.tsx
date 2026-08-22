import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import type { TooltipValueType } from 'recharts'

import { is_number_value, is_string_value } from '@/lib/boundary_parse'
import {
  CHART_BAR_GRADIENT_END_OPACITY,
  CHART_GRID_STROKE,
  CHART_TOOLTIP_DURATION_MS,
  CHART_TOOLTIP_SURFACE_CLASS,
  chart_bar_gradient_id,
  chart_bar_gradient_stops,
  chart_gradient_axis,
  chart_grid_lines,
  type ChartGridLayout,
} from '@/lib/chart_chrome'
import type { ExternalObject, ExternalValue } from '@/lib/json_value'
import { cn } from '@/lib/utils'

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const

const INITIAL_DIMENSION = { width: 320, height: 200 } as const
type TooltipNameType = number | string

type ChartThemeKey = keyof typeof THEMES

type ChartTooltipPayload = NonNullable<
  RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>['payload']
>[number]

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<ChartThemeKey, string> })
>

type ChartContextProps = {
  config: ChartConfig
  chart_id: string
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />')
  }

  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
  initialDimension?: {
    width: number
    height: number
  }
}) {
  const uniqueId = React.useId()
  const chart_id = `chart-${id ?? uniqueId.replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config, chart_id }}>
      <div
        data-slot="chart"
        data-chart={chart_id}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-base-content/60 [&_.recharts-cartesian-grid_line]:stroke-base-content/15 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-transparent [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-base-content/15 [&_.recharts-radial-bar-background-sector]:fill-base-200 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-transparent [&_.recharts-reference-line_[stroke='#ccc']]:stroke-base-content/15 [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chart_id} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme ?? config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => {
            const theme_key: ChartThemeKey = theme === 'dark' ? 'dark' : 'light'
            return `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme_key] ?? itemConfig.color
    return color
      ? `  --color-${key}: ${color};\n  --fill-${key}: url(#${chart_bar_gradient_id(id, key)});`
      : null
  })
  .join('\n')}
}
`
          })
          .join('\n'),
      }}
    />
  )
}

function ChartTooltip({
  cursor = false,
  animationDuration = CHART_TOOLTIP_DURATION_MS,
  ...props
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip>) {
  return (
    <RechartsPrimitive.Tooltip cursor={cursor} animationDuration={animationDuration} {...props} />
  )
}

function ChartGrid({
  layout = 'vertical',
  strokeDasharray = '3 3',
  stroke = CHART_GRID_STROKE,
  ...props
}: Omit<React.ComponentProps<typeof RechartsPrimitive.CartesianGrid>, 'vertical' | 'horizontal'> & {
  layout?: ChartGridLayout
}) {
  const lines = chart_grid_lines(layout)
  return (
    <RechartsPrimitive.CartesianGrid
      strokeDasharray={strokeDasharray}
      stroke={stroke}
      vertical={lines.vertical}
      horizontal={lines.horizontal}
      {...props}
    />
  )
}

function ChartSeriesGradients({ layout = 'vertical' }: { layout?: 'vertical' | 'horizontal' }) {
  const { config, chart_id } = useChart()
  const axis = chart_gradient_axis(layout)

  return (
    <defs>
      {Object.keys(config).map((key) => {
        const color = `var(--color-${key})`
        return (
          <linearGradient key={key} id={chart_bar_gradient_id(chart_id, key)} {...axis}>
            {chart_bar_gradient_stops(color, CHART_BAR_GRADIENT_END_OPACITY).map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </linearGradient>
        )
      })}
    </defs>
  )
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: 'line' | 'dot' | 'dashed'
    nameKey?: string
    labelKey?: string
  } & Omit<
    RechartsPrimitive.DefaultTooltipContentProps<TooltipValueType, TooltipNameType>,
    'accessibilityLayer'
  >) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null
    }

    const [item] = payload
    const key = `${labelKey ?? item?.dataKey ?? item?.name ?? 'value'}`
    const itemConfig = getPayloadConfigFromPayload(config, item, key)
    const label_text = read_chart_label(label)
    const value =
      !labelKey && label_text !== undefined
        ? (config[label_text]?.label ?? label_text)
        : itemConfig?.label

    if (labelFormatter) {
      return (
        <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
      )
    }

    if (!value) {
      return null
    }

    return <div className={cn('font-medium', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) {
    return null
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(CHART_TOOLTIP_SURFACE_CLASS, 'grid min-w-32 items-start gap-1.5', className)}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => {
            const key = `${nameKey ?? item.name ?? item.dataKey ?? 'value'}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color ?? item.payload?.fill ?? item.color
            const indicator_style = chart_indicator_style(indicatorColor)

            return (
              <div
                key={index}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-base-content/60',
                  indicator === 'dot' && 'items-center',
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
                            {
                              'h-2.5 w-2.5': indicator === 'dot',
                              'w-1': indicator === 'line',
                              'w-0 border-[1.5px] border-dashed bg-transparent':
                                indicator === 'dashed',
                              'my-0.5': nestLabel && indicator === 'dashed',
                            },
                          )}
                          style={indicator_style}
                        />
                      )
                    )}
                    <div
                      className={cn(
                        'flex flex-1 justify-between gap-2 leading-none',
                        nestLabel ? 'items-end' : 'items-center',
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-base-content/60">
                          {itemConfig?.label ?? item.name}
                        </span>
                      </div>
                      {item.value != null && (
                        <span className="font-mono font-medium text-base-content tabular-nums">
                          {format_tooltip_value(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
      </div>
    </div>
  )
}

const ChartLegend = RechartsPrimitive.Legend

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> & {
  hideIcon?: boolean
  nameKey?: string
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = `${nameKey ?? item.dataKey ?? 'value'}`
          const itemConfig = getLegendConfigFromPayload(config, item, key)

          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-base-content/60',
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
    </div>
  )
}

type ChartLegendPayload = NonNullable<
  RechartsPrimitive.DefaultLegendContentProps['payload']
>[number]

function read_chart_label(label: React.ReactNode | undefined): string | undefined {
  if (label === undefined || label === null) return undefined
  if (Object.prototype.toString.call(label) === '[object String]') return String(label)
  return undefined
}

function format_tooltip_value(value: TooltipValueType | undefined): string {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) return value.map((entry) => String(entry)).join(', ')
  const tag = Object.prototype.toString.call(value)
  if (tag === '[object Number]' && Number.isFinite(value)) return Number(value).toLocaleString()
  return String(value)
}

function tooltip_value_as_external(
  value: TooltipValueType | TooltipNameType | undefined,
): ExternalValue {
  if (value === undefined) return null
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const tag = Object.prototype.toString.call(entry)
      if (tag === '[object Number]' && Number.isFinite(entry)) return Number(entry)
      return String(entry)
    })
  }
  const tag = Object.prototype.toString.call(value)
  if (tag === '[object String]') return String(value)
  if (tag === '[object Number]' && Number.isFinite(value)) return Number(value)
  return String(value)
}

function recharts_data_key_as_external(
  value: ChartTooltipPayload['dataKey'],
): ExternalValue | undefined {
  if (value === undefined) return undefined
  if (Object.prototype.toString.call(value) === '[object Function]') return undefined
  const tag = Object.prototype.toString.call(value)
  if (tag === '[object String]') return String(value)
  if (tag === '[object Number]' && Number.isFinite(value)) return Number(value)
  return undefined
}

function legend_data_key_as_external(
  value: ChartLegendPayload['dataKey'],
): ExternalValue | undefined {
  if (value === undefined) return undefined
  if (Object.prototype.toString.call(value) === '[object Function]') return undefined
  const tag = Object.prototype.toString.call(value)
  if (tag === '[object String]') return String(value)
  if (tag === '[object Number]' && Number.isFinite(value)) return Number(value)
  return undefined
}

function chart_indicator_style(color: string | undefined): React.CSSProperties {
  if (!color) return {}
  // SAFETY: CSS custom properties for chart indicators are not part of the standard CSSProperties map.
  return {
    ['--color-bg']: color,
    ['--color-border']: color,
  } as React.CSSProperties
}

function read_string_field(record: ExternalObject, key: string): string | undefined {
  const value = record[key]
  if (is_string_value(value)) return value
  if (is_number_value(value)) return String(value)
  return undefined
}

function chart_payload_object(
  payload: ChartTooltipPayload | undefined,
): ExternalObject | undefined {
  const nested = payload?.payload
  if (nested === null || nested === undefined || Array.isArray(nested)) return undefined
  if (Object.prototype.toString.call(nested) !== '[object Object]') return undefined
  // SAFETY: Recharts tooltip payload objects are plain records decoded at the chart boundary.
  return nested as ExternalObject
}

function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: ChartTooltipPayload | undefined,
  key: string,
) {
  if (!payload) return undefined

  const payload_object: ExternalObject = {}
  if (payload.name !== undefined) payload_object.name = tooltip_value_as_external(payload.name)
  const data_key = recharts_data_key_as_external(payload.dataKey)
  if (data_key !== undefined) payload_object.dataKey = data_key
  payload_object.value = tooltip_value_as_external(payload.value)

  let configLabelKey = key

  const payload_label = read_string_field(payload_object, key)
  if (payload_label) {
    configLabelKey = payload_label
  } else {
    const nested = chart_payload_object(payload)
    if (nested) {
      const nested_label = read_string_field(nested, key)
      if (nested_label) configLabelKey = nested_label
    }
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

function getLegendConfigFromPayload(
  config: ChartConfig,
  payload: ChartLegendPayload | undefined,
  key: string,
) {
  if (!payload) return undefined

  const payload_object: ExternalObject = {}
  if (payload.value !== undefined) payload_object.value = tooltip_value_as_external(payload.value)
  const data_key = legend_data_key_as_external(payload.dataKey)
  if (data_key !== undefined) payload_object.dataKey = data_key

  let configLabelKey = key
  const payload_label = read_string_field(payload_object, key)
  if (payload_label) configLabelKey = payload_label

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

export {
  ChartContainer,
  ChartGrid,
  ChartSeriesGradients,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  CHART_TOOLTIP_SURFACE_CLASS,
}

export {
  CHART_BAR_RADIUS,
  CHART_INTRO_DURATION_MS,
  CHART_LINE_ACTIVE_DOT,
  CHART_VERTICAL_BAR_RADIUS,
  chart_bar_fill,
  chart_is_animation_active,
} from '@/lib/chart_chrome'

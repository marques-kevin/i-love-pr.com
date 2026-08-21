import type { ReactNode } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { HelpCircleIcon } from '@/components/icons/help_circle'
import { Button } from '@/components/ui/button'

function HelpButton({ help }: { help: string }) {
  const intl = useIntl()
  return (
    <div className="dropdown dropdown-end">
      <Button
        type="button"
        tabIndex={0}
        className="btn-ghost btn-circle btn-xs text-base-content/60"
        aria-label={intl.formatMessage({ id: 'chart.help_aria' })}
      >
        <HoverIcon icon={HelpCircleIcon} size={16} />
      </Button>
      <div
        tabIndex={-1}
        className="dropdown-content bg-base-100 rounded-box z-50 w-80 max-w-[calc(100vw-2rem)] p-3 shadow"
      >
        <p className="text-sm leading-relaxed whitespace-pre-line">{help}</p>
      </div>
    </div>
  )
}

export function Panel({
  title,
  description,
  help,
  children,
}: {
  title: string
  description?: string
  help?: string
  children: ReactNode
}) {
  return (
    <section className="card bg-base-100 ring-base-content/10 shadow-none ring-1">
      <div className="card-body gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="card-title font-display text-lg">{title}</h2>
            {description ? (
              <p className="text-base-content/60 text-sm font-normal">{description}</p>
            ) : null}
          </div>
          {help ? <HelpButton help={help} /> : null}
        </div>
        <div>{children}</div>
      </div>
    </section>
  )
}

export function StatCard({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <section className="card bg-base-100 ring-base-content/10 shadow-none ring-1">
      <div className="card-body gap-2 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base-content/60 text-sm font-medium">{label}</h2>
          {help ? <HelpButton help={help} /> : null}
        </div>
        <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
      </div>
    </section>
  )
}

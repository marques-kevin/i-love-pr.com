import type { ReactNode } from 'react'
import { CircleHelp } from 'lucide-react'
import { useIntl } from 'react-intl'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

function HelpButton({ help }: { help: string }) {
  const intl = useIntl()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-foreground"
          aria-label={intl.formatMessage({ id: 'chart.help_aria' })}
        >
          <CircleHelp className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-3">
        <p className="whitespace-pre-line text-sm leading-relaxed text-popover-foreground">
          {help}
        </p>
      </PopoverContent>
    </Popover>
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
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        {description && <p className="text-sm font-normal text-muted-foreground">{description}</p>}
        {help ? (
          <CardAction>
            <HelpButton help={help} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function StatCard({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {help ? (
          <CardAction>
            <HelpButton help={help} />
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

import type { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function Panel({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="font-display text-lg">{title}</CardTitle>
        {description && <p className="text-sm font-normal text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

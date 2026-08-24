export function ImportProgress({ step_label, percent }: { step_label: string; percent: number }) {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-base-content/70 text-sm">{step_label}</p>
      <progress className="progress progress-primary w-full" value={percent} max={100} />
    </div>
  )
}

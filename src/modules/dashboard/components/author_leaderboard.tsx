import { useIntl } from 'react-intl'
import { Panel } from './panel'
import { connector, type ConnectorProps } from './author_leaderboard.connector'

function format_hours(h: number | null): string {
  if (h == null) return '—'
  if (h < 24) return `${h.toFixed(1)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function Wrapper({ data }: ConnectorProps) {
  const intl = useIntl()
  if (!data) return null

  return (
    <Panel
      title={intl.formatMessage({ id: 'chart.author_leaderboard.title' })}
      help={intl.formatMessage({ id: 'chart.author_leaderboard.help' })}
    >
      {data.length === 0 ? (
        <p className="text-sm text-base-content/60">
          {intl.formatMessage({ id: 'chart.author_leaderboard.empty' })}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr>
                <th className="pb-2 pr-3 font-medium">
                  {intl.formatMessage({ id: 'chart.author_leaderboard.author' })}
                </th>
                <th className="pb-2 pr-3 font-medium">
                  {intl.formatMessage({ id: 'chart.author_leaderboard.merged' })}
                </th>
                <th className="pb-2 pr-3 font-medium">
                  {intl.formatMessage({ id: 'chart.author_leaderboard.cycle' })}
                </th>
                <th className="pb-2 pr-3 font-medium">
                  {intl.formatMessage({ id: 'chart.author_leaderboard.size' })}
                </th>
                <th className="pb-2 font-medium">
                  {intl.formatMessage({ id: 'chart.author_leaderboard.rounds' })}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-300">
              {data.map((row) => (
                <tr key={row.author}>
                  <td className="py-2 pr-3 font-medium text-base-content">@{row.author}</td>
                  <td className="py-2 pr-3 text-base-content">{row.mergedCount}</td>
                  <td className="py-2 pr-3 text-base-content">
                    {format_hours(row.avgCycleTimeHours)}
                  </td>
                  <td className="py-2 pr-3 text-base-content">
                    {row.avgLinesChanged == null ? '—' : Math.round(row.avgLinesChanged)}
                  </td>
                  <td className="py-2 text-base-content">
                    {row.avgReviewRounds == null ? '—' : row.avgReviewRounds.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

export const AuthorLeaderboard = connector(Wrapper)

export const DEFAULT_IGNORED_BOTS = [
  'dependabot[bot]',
  'dependabot',
  'renovate[bot]',
  'renovate',
  'github-actions[bot]',
  'greenkeeper[bot]',
  'snyk-bot',
  'codecov[bot]',
  'codecov-commenter',
  'imgbot[bot]',
  'mergify[bot]',
  'vercel[bot]',
  'netlify[bot]',
  'copilot-pull-request-reviewer',
  'copilot-swe-agent[bot]',
]

export function isBotLogin(login: string, ignoredBots: string[]): boolean {
  const normalized = login.toLowerCase()
  return ignoredBots.some((bot) => {
    const b = bot.toLowerCase()
    return normalized === b || normalized === `${b}[bot]` || normalized.endsWith('[bot]')
  })
}

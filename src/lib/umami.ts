export const UMAMI_SCRIPT_URL = 'https://umami.foudroyer.com/analytics.js'
export const UMAMI_WEBSITE_ID = 'd9948368-b918-43ca-9339-046d7b481ce6'

export const UMAMI_TRACKING_DOMAINS = ['i-love-pr.com', 'www.i-love-pr.com'] as const

export function is_umami_tracking_hostname(hostname: string): boolean {
  return (UMAMI_TRACKING_DOMAINS as readonly string[]).includes(hostname)
}

export function get_umami_data_domains(): string {
  return UMAMI_TRACKING_DOMAINS.join(',')
}

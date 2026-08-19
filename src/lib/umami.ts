/// <reference lib="dom" />

export const UMAMI_SCRIPT_URL = 'https://umami.foudroyer.com/analytics.js'
export const UMAMI_WEBSITE_ID = 'd9948368-b918-43ca-9339-046d7b481ce6'

export const UMAMI_TRACKING_DOMAINS = ['i-love-pr.com', 'www.i-love-pr.com'] as const

export function is_umami_tracking_hostname(hostname: string): boolean {
  for (const domain of UMAMI_TRACKING_DOMAINS) {
    if (domain === hostname) return true
  }
  return false
}

export function get_umami_data_domains(): string {
  return UMAMI_TRACKING_DOMAINS.join(',')
}

export type UmamiActivationEvent = 'token_saved' | 'repository_added' | 'sync_completed'

declare global {
  interface Window {
    umami?: {
      track: (name: string) => void
    }
  }
}

export function track_umami_event(name: UmamiActivationEvent): void {
  if (!('window' in globalThis)) return
  globalThis.window.umami?.track(name)
}

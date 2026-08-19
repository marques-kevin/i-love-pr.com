import { GitHubMark } from '@/components/github_mark'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { APP_GITHUB_URL, APP_VERSION } from '@/lib/app_meta'
import { LocaleSwitcher } from '@/modules/i18n'

export function AppChromeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
        <a href="/" className="flex min-w-0 items-center text-foreground no-underline">
          <IlovePrLogo className="h-7 w-auto shrink-0 sm:h-8" />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-xs font-medium tabular-nums text-muted-foreground sm:inline">
            v{APP_VERSION}
          </span>
          <a
            href={APP_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-background px-2.5 text-sm text-foreground shadow-[0_0_0_1px_color-mix(in_oklch,var(--foreground)_10%,transparent)] sm:px-3"
          >
            <GitHubMark className="size-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}

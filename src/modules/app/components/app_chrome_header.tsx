import { Button } from '@/components/ui/button'
import { GitHubMark } from '@/components/github_mark'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { APP_GITHUB_URL, APP_VERSION } from '@/lib/app_meta'
import { LocaleSwitcher } from '@/modules/i18n'

export function AppChromeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex min-w-0 items-center text-foreground no-underline">
          <IlovePrLogo className="h-7 w-auto shrink-0 sm:h-8" />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            v{APP_VERSION}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-full border-foreground/15 bg-background px-3 shadow-none"
            asChild
          >
            <a href={APP_GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubMark className="size-4" />
              GitHub
            </a>
          </Button>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}

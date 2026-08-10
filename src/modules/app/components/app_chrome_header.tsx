import { APP_GITHUB_URL, APP_NAME, APP_VERSION } from '@/lib/app_meta'
import { GitHubMark } from '@/components/github_mark'

export function AppChromeHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex min-w-0 items-center gap-2.5 text-foreground no-underline">
          <img
            src="/favicon.svg"
            alt=""
            width={22}
            height={22}
            className="size-[22px] shrink-0 rounded-md"
          />
          <span className="font-display text-[15px] font-bold tracking-tight">{APP_NAME}</span>
        </a>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="text-xs font-medium tabular-nums text-primary/80">v{APP_VERSION}</span>
          <a
            href={APP_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            data-cuelume-hover="tick"
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="GitHub"
            title="GitHub"
          >
            <GitHubMark className="size-4" />
          </a>
        </div>
      </div>
    </header>
  )
}

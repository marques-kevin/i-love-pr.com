import { GithubIcon } from '@/components/icons/github'
import { IlovePrLogo } from '@/components/ilove_pr_logo'
import { APP_GITHUB_URL, APP_VERSION } from '@/lib/app_meta'
import { LocaleSwitcher } from '@/modules/i18n'

export function AppChromeHeader() {
  return (
    <header className="navbar bg-base-100/90 sticky top-0 z-40 border-b border-base-300/60 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-6">
        <a href="/" className="flex min-w-0 items-center text-base-content no-underline">
          <IlovePrLogo className="h-7 w-auto shrink-0 sm:h-8" />
        </a>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-base-content/60 hidden text-xs font-medium tabular-nums sm:inline">
            v{APP_VERSION}
          </span>
          <a
            href={APP_GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            className="btn btn-ghost btn-sm rounded-full"
          >
            <GithubIcon size={16} aria-hidden={true} />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  )
}

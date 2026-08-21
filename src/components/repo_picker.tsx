import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { HoverIcon } from '@/components/hover_icon'
import { Cancel01Icon } from '@/components/icons/cancel_01'
import { ChevronDownIcon } from '@/components/icons/chevron_down'
import { Loading03Icon } from '@/components/icons/loading_03'
import { Tick02Icon } from '@/components/icons/tick_02'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { close_daisy_dropdown } from '@/lib/daisy'
import { GitHubClient, parseRepoFullName, type GitHubRepoOption } from '@/lib/github-client'
interface RepoPickerProps {
  availableRepos: GitHubRepoOption[]
  selected: string[]
  onChange: (repos: string[]) => void
  /** Used to validate manually entered public repos */
  token?: string
  loading?: boolean
  disabled?: boolean
  id?: string
  /** When false, manual public-repo input is hidden behind a link (onboarding). */
  manual_add_visible?: boolean
}

export function RepoPicker({
  availableRepos,
  selected,
  onChange,
  token,
  loading = false,
  disabled = false,
  id = 'repo-picker',
  manual_add_visible = true,
}: RepoPickerProps) {
  const intl = useIntl()
  const [query, set_query] = useState('')
  const [manual_input, set_manual_input] = useState('')
  const [manual_error, set_manual_error] = useState<string | null>(null)
  const [adding_manual, set_adding_manual] = useState(false)
  const [show_manual_add, set_show_manual_add] = useState(manual_add_visible)

  const options = useMemo(() => {
    const map = new Map(availableRepos.map((r) => [r.fullName, r]))
    for (const fullName of selected) {
      if (!map.has(fullName)) {
        map.set(fullName, { fullName, isPrivate: false })
      }
    }
    return [...map.values()].sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [availableRepos, selected])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((repo) => repo.fullName.toLowerCase().includes(needle))
  }, [options, query])

  function addRepo(fullName: string) {
    if (selected.includes(fullName)) return
    onChange([...selected, fullName])
  }

  function removeRepo(fullName: string) {
    onChange(selected.filter((r) => r !== fullName))
  }

  async function addManualRepo() {
    set_manual_error(null)
    const parsed = parseRepoFullName(manual_input)
    if (!parsed) {
      set_manual_error(intl.formatMessage({ id: 'repo_picker.error.format' }))
      return
    }

    const full = `${parsed.owner}/${parsed.name}`
    if (selected.includes(full)) {
      set_manual_input('')
      return
    }

    if (!token?.trim()) {
      addRepo(full)
      set_manual_input('')
      return
    }

    set_adding_manual(true)
    try {
      const client = new GitHubClient(token.trim())
      const resolved = await client.resolveRepository(parsed.owner, parsed.name)
      addRepo(resolved.fullName)
      set_manual_input('')
    } catch (e) {
      set_manual_error(
        e instanceof Error ? e.message : intl.formatMessage({ id: 'repo_picker.error.not_found' }),
      )
    } finally {
      set_adding_manual(false)
    }
  }

  const combobox_placeholder = loading
    ? intl.formatMessage({ id: 'repo_picker.loading' })
    : disabled
      ? intl.formatMessage({ id: 'repo_picker.validate_first' })
      : options.length === 0
        ? intl.formatMessage({ id: 'repo_picker.no_repos' })
        : intl.formatMessage({ id: 'repo_picker.select_placeholder' })

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="label">
        {intl.formatMessage({ id: 'repo_picker.label' })}
      </label>
      <div className="dropdown w-full">
        <Button
          id={id}
          type="button"
          tabIndex={0}
          role="combobox"
          disabled={disabled || loading}
          className="btn-outline h-10 w-full justify-between font-normal"
        >
          <span className="text-base-content/60 truncate">{combobox_placeholder}</span>
          {loading ? (
            <Loading03Icon size={16} className="animate-spin opacity-60" aria-hidden={true} />
          ) : (
            <HoverIcon icon={ChevronDownIcon} size={16} icon_className="opacity-60" />
          )}
        </Button>
        <div
          tabIndex={-1}
          className="dropdown-content bg-base-100 rounded-box z-50 mt-2 w-full p-2 shadow"
        >
          <Input
            value={query}
            onChange={(event) => set_query(event.target.value)}
            placeholder={intl.formatMessage({ id: 'repo_picker.search_placeholder' })}
            className="input-sm mb-2"
          />
          <ul className="menu max-h-64 overflow-y-auto p-0">
            {filtered.length === 0 ? (
              <li className="text-base-content/60 px-3 py-4 text-center text-sm">
                {intl.formatMessage({ id: 'repo_picker.search_empty' })}
              </li>
            ) : (
              filtered.map((repo) => {
                const isSelected = selected.includes(repo.fullName)
                return (
                  <li key={repo.fullName}>
                    <button
                      type="button"
                      disabled={isSelected}
                      onClick={(event) => {
                        addRepo(repo.fullName)
                        close_daisy_dropdown(event.currentTarget)
                      }}
                    >
                      <HoverIcon
                        icon={Tick02Icon}
                        size={16}
                        icon_className={isSelected ? 'opacity-100' : 'opacity-0'}
                      />
                      <span className="flex-1 truncate">{repo.fullName}</span>
                      {repo.isPrivate ? (
                        <span className="badge badge-ghost badge-xs">
                          {intl.formatMessage({ id: 'repo_picker.private_badge' })}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      </div>

      {!manual_add_visible && !show_manual_add && (
        <Button
          type="button"
          className="btn-link h-auto min-h-0 p-0"
          onClick={() => set_show_manual_add(true)}
        >
          {intl.formatMessage({ id: 'onboarding.add_public_repo_link' })}
        </Button>
      )}

      {(manual_add_visible || show_manual_add) && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={manual_input}
            onChange={(e) => {
              set_manual_input(e.target.value)
              set_manual_error(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void addManualRepo()
              }
            }}
            placeholder={intl.formatMessage({ id: 'repo_picker.manual_placeholder' })}
            disabled={disabled || adding_manual}
            className="h-10 flex-1"
          />
          <Button
            type="button"
            className="btn-outline h-10"
            disabled={disabled || adding_manual || !manual_input.trim()}
            onClick={() => void addManualRepo()}
          >
            {adding_manual ? (
              <>
                <Loading03Icon size={16} className="animate-spin" aria-hidden={true} />
                {intl.formatMessage({ id: 'repo_picker.checking' })}
              </>
            ) : (
              intl.formatMessage({ id: 'repo_picker.add' })
            )}
          </Button>
        </div>
      )}
      {manual_error ? <p className="text-error text-sm">{manual_error}</p> : null}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((repo) => (
            <span key={repo} className="badge badge-ghost gap-1 pr-1">
              {repo}
              <button
                type="button"
                aria-label={intl.formatMessage({ id: 'repo_picker.remove' }, { repo })}
                onClick={() => removeRepo(repo)}
                className="hover:bg-base-content/10 rounded-full p-0.5"
              >
                <HoverIcon icon={Cancel01Icon} size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

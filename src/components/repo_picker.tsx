import { useMemo, useState } from 'react'
import { useIntl } from 'react-intl'
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GitHubClient, parseRepoFullName, type GitHubRepoOption } from '@/lib/github-client'
import { cn } from '@/lib/utils'

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
  const [open, setOpen] = useState(false)
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

  function addRepo(fullName: string) {
    if (selected.includes(fullName)) return
    onChange([...selected, fullName])
    setOpen(false)
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
      <Label htmlFor={id}>{intl.formatMessage({ id: 'repo_picker.label' })}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || loading}
            className="h-10 w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">{combobox_placeholder}</span>
            {loading ? (
              <Loader2Icon className="size-4 animate-spin opacity-60" />
            ) : (
              <ChevronsUpDownIcon className="size-4 opacity-60" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={intl.formatMessage({ id: 'repo_picker.search_placeholder' })}
            />
            <CommandList>
              <CommandEmpty>{intl.formatMessage({ id: 'repo_picker.search_empty' })}</CommandEmpty>
              <CommandGroup>
                {options.map((repo) => {
                  const isSelected = selected.includes(repo.fullName)
                  return (
                    <CommandItem
                      key={repo.fullName}
                      value={repo.fullName}
                      disabled={isSelected}
                      onSelect={() => addRepo(repo.fullName)}
                    >
                      <CheckIcon
                        className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                      />
                      <span className="flex-1 truncate">{repo.fullName}</span>
                      {repo.isPrivate && (
                        <Badge variant="secondary" className="text-[10px]">
                          {intl.formatMessage({ id: 'repo_picker.private_badge' })}
                        </Badge>
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!manual_add_visible && !show_manual_add && (
        <Button
          type="button"
          variant="link"
          className="h-auto p-0 text-primary"
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
            variant="outline"
            className="h-10"
            disabled={disabled || adding_manual || !manual_input.trim()}
            onClick={() => void addManualRepo()}
          >
            {adding_manual ? (
              <>
                <Loader2Icon className="animate-spin" />
                {intl.formatMessage({ id: 'repo_picker.checking' })}
              </>
            ) : (
              intl.formatMessage({ id: 'repo_picker.add' })
            )}
          </Button>
        </div>
      )}
      {manual_error && <p className="text-sm text-destructive">{manual_error}</p>}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((repo) => (
            <Badge key={repo} variant="secondary" className="gap-1 pr-1">
              {repo}
              <button
                type="button"
                aria-label={intl.formatMessage({ id: 'repo_picker.remove' }, { repo })}
                onClick={() => removeRepo(repo)}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

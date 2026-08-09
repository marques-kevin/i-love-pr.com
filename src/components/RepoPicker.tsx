import { useMemo, useState } from 'react'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  XIcon,
} from 'lucide-react'
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
import {
  GitHubClient,
  parseRepoFullName,
  type GitHubRepoOption,
} from '@/lib/github-client'
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
}

export function RepoPicker({
  availableRepos,
  selected,
  onChange,
  token,
  loading = false,
  disabled = false,
  id = 'repo-picker',
}: RepoPickerProps) {
  const [open, setOpen] = useState(false)
  const [manualInput, setManualInput] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [addingManual, setAddingManual] = useState(false)

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
    setManualError(null)
    const parsed = parseRepoFullName(manualInput)
    if (!parsed) {
      setManualError('Format attendu : owner/repo')
      return
    }

    const full = `${parsed.owner}/${parsed.name}`
    if (selected.includes(full)) {
      setManualInput('')
      return
    }

    if (!token?.trim()) {
      // Fallback without validation if token missing
      addRepo(full)
      setManualInput('')
      return
    }

    setAddingManual(true)
    try {
      const client = new GitHubClient(token.trim())
      const resolved = await client.resolveRepository(parsed.owner, parsed.name)
      addRepo(resolved.fullName)
      setManualInput('')
    } catch (e) {
      setManualError(
        e instanceof Error
          ? e.message
          : 'Repository introuvable ou inaccessible',
      )
    } finally {
      setAddingManual(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Repositories to track</Label>
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
            <span className="truncate text-muted-foreground">
              {loading
                ? 'Loading repositories…'
                : disabled
                  ? 'Validate your token first'
                  : options.length === 0
                    ? 'No repositories found'
                    : 'Select a repository…'}
            </span>
            {loading ? (
              <Loader2Icon className="size-4 animate-spin opacity-60" />
            ) : (
              <ChevronsUpDownIcon className="size-4 opacity-60" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search owner/repo…" />
            <CommandList>
              <CommandEmpty>No repository found.</CommandEmpty>
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
                        className={cn(
                          'size-4',
                          isSelected ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <span className="flex-1 truncate">{repo.fullName}</span>
                      {repo.isPrivate && (
                        <Badge variant="secondary" className="text-[10px]">
                          private
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

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={manualInput}
          onChange={(e) => {
            setManualInput(e.target.value)
            setManualError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void addManualRepo()
            }
          }}
          placeholder="Or paste a public repo: owner/repo"
          disabled={disabled || addingManual}
          className="h-10 flex-1"
        />
        <Button
          type="button"
          variant="outline"
          className="h-10"
          disabled={disabled || addingManual || !manualInput.trim()}
          onClick={() => void addManualRepo()}
        >
          {addingManual ? (
            <>
              <Loader2Icon className="animate-spin" />
              Checking…
            </>
          ) : (
            'Add'
          )}
        </Button>
      </div>
      {manualError && (
        <p className="text-sm text-destructive">{manualError}</p>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selected.map((repo) => (
            <Badge key={repo} variant="secondary" className="gap-1 pr-1">
              {repo}
              <button
                type="button"
                aria-label={`Remove ${repo}`}
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

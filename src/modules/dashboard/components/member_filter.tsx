import { useEffect, useState } from 'react'
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UsersIcon,
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
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { MemberTeam } from '@/lib/types'
import { connector, type ConnectorProps } from './member_filter.connector'

export function Wrapper({
  contributors,
  selected,
  teams,
  set_members,
  upsert_team,
  delete_team,
}: ConnectorProps) {
  const onChange = set_members

  async function onSaveTeam(name: string, members: string[], id?: string) {
    const next = await upsert_team({ name, members, id }).unwrap()
    const team =
      (id ? next.teams.find((t) => t.id === id) : null) ??
      next.teams.find((t) => t.name.toLowerCase() === name.trim().toLowerCase())
    if (team) set_members([...team.members])
  }

  async function onDeleteTeam(id: string) {
    await delete_team(id)
  }

  const [memberOpen, setMemberOpen] = useState(false)
  const [teamsOpen, setTeamsOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)
  const [manageTeamId, setManageTeamId] = useState<string | null>(null)
  const [manageMembers, setManageMembers] = useState<string[]>([])
  const [manageName, setManageName] = useState('')

  const activeTeam = teams.find((t) => t.id === activeTeamId) ?? null
  const manageTeam = teams.find((t) => t.id === manageTeamId) ?? null
  const teamMode = Boolean(activeTeam)

  // Keep active team in sync if it was updated/deleted externally
  useEffect(() => {
    if (!activeTeamId) return
    const team = teams.find((t) => t.id === activeTeamId)
    if (!team) {
      setActiveTeamId(null)
      return
    }
    const same =
      selected.length === team.members.length && team.members.every((m) => selected.includes(m))
    if (!same) {
      // Selection diverged manually — drop team mode
      setActiveTeamId(null)
    }
  }, [teams, activeTeamId, selected])

  function add(member: string) {
    if (selected.includes(member)) return
    onChange([...selected, member])
    setActiveTeamId(null)
    setMemberOpen(false)
  }

  function remove(member: string) {
    onChange(selected.filter((m) => m !== member))
    setActiveTeamId(null)
  }

  function clear() {
    onChange([])
    setActiveTeamId(null)
  }

  function applyTeam(team: MemberTeam) {
    onChange([...team.members])
    setActiveTeamId(team.id)
    setTeamsOpen(false)
  }

  function openManage(team: MemberTeam) {
    setManageTeamId(team.id)
    setManageMembers([...team.members])
    setManageName(team.name)
    setSaveError(null)
    setTeamsOpen(false)
    setManageOpen(true)
  }

  function toggleManageMember(login: string) {
    setManageMembers((prev) =>
      prev.includes(login) ? prev.filter((m) => m !== login) : [...prev, login],
    )
  }

  async function handleSaveNew() {
    setSaveError(null)
    setSaving(true)
    try {
      await onSaveTeam(teamName, selected)
      setSaveOpen(false)
      setTeamName('')
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save team')
    } finally {
      setSaving(false)
    }
  }

  async function handleManageSave() {
    if (!manageTeam) return
    setSaveError(null)
    setSaving(true)
    try {
      await onSaveTeam(manageName, manageMembers, manageTeam.id)
      onChange([...manageMembers])
      setActiveTeamId(manageTeam.id)
      setManageOpen(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Failed to update team')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    await onDeleteTeam(id)
    if (activeTeamId === id) {
      setActiveTeamId(null)
      onChange([])
    }
  }

  const managePool = [...new Set([...contributors, ...manageMembers])].sort((a, b) =>
    a.localeCompare(b),
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {selected.length === 0 ? (
          <Badge variant="secondary">Entire team</Badge>
        ) : teamMode && activeTeam ? (
          <Badge variant="default" className="gap-1.5 pr-1">
            <UsersIcon className="size-3" />
            {activeTeam.name}
            <span className="opacity-70">· {activeTeam.members.length}</span>
            <button
              type="button"
              aria-label={`Clear team ${activeTeam.name}`}
              onClick={clear}
              className="rounded-full p-0.5 hover:bg-primary-foreground/20"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        ) : (
          selected.map((member) => (
            <Badge key={member} variant="default" className="gap-1 pr-1">
              @{member}
              <button
                type="button"
                aria-label={`Remove ${member}`}
                onClick={() => remove(member)}
                className="rounded-full p-0.5 hover:bg-primary-foreground/20"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))
        )}

        {!teamMode && (
          <Popover open={memberOpen} onOpenChange={setMemberOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1"
                disabled={contributors.length === 0}
              >
                <PlusIcon className="size-3.5" />
                Add member
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search member…" />
                <CommandList>
                  <CommandEmpty>No member found.</CommandEmpty>
                  <CommandGroup>
                    {contributors.map((c) => {
                      const isSelected = selected.includes(c)
                      return (
                        <CommandItem
                          key={c}
                          value={c}
                          onSelect={() => {
                            if (isSelected) remove(c)
                            else add(c)
                          }}
                        >
                          <CheckIcon
                            className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                          />
                          @{c}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        <Popover open={teamsOpen} onOpenChange={setTeamsOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1">
              <UsersIcon className="size-3.5" />
              Teams
              {teams.length > 0 && <span className="text-muted-foreground">({teams.length})</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search teams…" />
              <CommandList>
                <CommandEmpty>No saved teams yet.</CommandEmpty>
                <CommandGroup heading="Saved teams">
                  {teams.map((team) => (
                    <CommandItem
                      key={team.id}
                      value={team.name}
                      onSelect={() => applyTeam(team)}
                      className="items-start py-2"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex items-center gap-2">
                          <CheckIcon
                            className={cn(
                              'size-4 shrink-0',
                              activeTeamId === team.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="truncate font-medium">{team.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {team.members.length}
                          </span>
                        </span>
                        <div className="flex gap-1 pl-6">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openManage(team)
                            }}
                          >
                            <PencilIcon className="size-3" />
                            Manage members
                          </button>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              void handleDelete(team.id)
                            }}
                          >
                            <Trash2Icon className="size-3" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {!teamMode && selected.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setTeamsOpen(false)
                          setTeamName('')
                          setSaveError(null)
                          setSaveOpen(true)
                        }}
                      >
                        <SaveIcon className="size-4" />
                        Save current selection…
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {!teamMode && selected.length > 0 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              onClick={() => {
                setTeamName('')
                setSaveError(null)
                setSaveOpen(true)
              }}
            >
              <SaveIcon className="size-3.5" />
              Save team
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={clear}>
              Clear
            </Button>
          </>
        )}

        {teamMode && (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1"
              onClick={() => activeTeam && openManage(activeTeam)}
            >
              <PencilIcon className="size-3.5" />
              Manage members
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={clear}>
              Clear
            </Button>
          </>
        )}
      </div>

      {/* Save new team from ad-hoc selection */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save team</DialogTitle>
            <DialogDescription>
              Store this member selection so you can reuse it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Platform, Frontend…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleSaveNew()
                  }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {selected.length} member{selected.length === 1 ? '' : 's'}:{' '}
              {selected.map((m) => `@${m}`).join(', ')}
            </p>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !teamName.trim() || selected.length === 0}
              onClick={() => void handleSaveNew()}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage team members */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage members</DialogTitle>
            <DialogDescription>
              Add or remove people from <strong>{manageTeam?.name ?? 'this team'}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manage-team-name">Team name</Label>
              <Input
                id="manage-team-name"
                value={manageName}
                onChange={(e) => setManageName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Members</Label>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {managePool.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-muted-foreground">
                    No contributors available yet. Sync a repo first.
                  </p>
                ) : (
                  managePool.map((login) => {
                    const checked = manageMembers.includes(login)
                    return (
                      <button
                        key={login}
                        type="button"
                        onClick={() => toggleManageMember(login)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                          checked && 'bg-accent/60',
                        )}
                      >
                        <CheckIcon
                          className={cn('size-4', checked ? 'opacity-100' : 'opacity-0')}
                        />
                        @{login}
                      </button>
                    )
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">{manageMembers.length} selected</p>
            </div>
            {saveError && <p className="text-sm text-destructive">{saveError}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setManageOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving || !manageName.trim() || manageMembers.length === 0}
              onClick={() => void handleManageSave()}
            >
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export const MemberFilter = connector(Wrapper)

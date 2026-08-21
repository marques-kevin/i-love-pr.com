import { useEffect, useMemo, useState } from 'react'
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SaveIcon,
  Trash2Icon,
  UsersIcon,
  XIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { close_daisy_dropdown } from '@/lib/daisy'
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

  const [member_query, set_member_query] = useState('')
  const [team_query, set_team_query] = useState('')
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

  const filtered_contributors = useMemo(() => {
    const needle = member_query.trim().toLowerCase()
    if (!needle) return contributors
    return contributors.filter((login) => login.toLowerCase().includes(needle))
  }, [contributors, member_query])

  const filtered_teams = useMemo(() => {
    const needle = team_query.trim().toLowerCase()
    if (!needle) return teams
    return teams.filter((team) => team.name.toLowerCase().includes(needle))
  }, [teams, team_query])

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
      setActiveTeamId(null)
    }
  }, [teams, activeTeamId, selected])

  function add(member: string) {
    if (selected.includes(member)) return
    onChange([...selected, member])
    setActiveTeamId(null)
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
  }

  function openManage(team: MemberTeam) {
    setManageTeamId(team.id)
    setManageMembers([...team.members])
    setManageName(team.name)
    setSaveError(null)
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
          <span className="badge badge-ghost">Entire team</span>
        ) : teamMode && activeTeam ? (
          <span className="badge badge-primary gap-1.5 pr-1">
            <UsersIcon className="size-3" />
            {activeTeam.name}
            <span className="opacity-70">· {activeTeam.members.length}</span>
            <button
              type="button"
              aria-label={`Clear team ${activeTeam.name}`}
              onClick={clear}
              className="hover:bg-primary-content/20 rounded-full p-0.5"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ) : (
          selected.map((member) => (
            <span key={member} className="badge badge-primary gap-1 pr-1">
              @{member}
              <button
                type="button"
                aria-label={`Remove ${member}`}
                onClick={() => remove(member)}
                className="hover:bg-primary-content/20 rounded-full p-0.5"
              >
                <XIcon className="size-3" />
              </button>
            </span>
          ))
        )}

        {!teamMode && (
          <div className="dropdown">
            <Button
              type="button"
              tabIndex={0}
              className="btn-outline btn-sm h-7 gap-1"
              disabled={contributors.length === 0}
            >
              <PlusIcon className="size-3.5" />
              Add member
            </Button>
            <div
              tabIndex={-1}
              className="dropdown-content bg-base-100 rounded-box z-50 w-56 p-2 shadow"
            >
              <Input
                value={member_query}
                onChange={(event) => set_member_query(event.target.value)}
                placeholder="Search member…"
                className="input-sm mb-2"
              />
              <ul className="menu max-h-64 overflow-y-auto p-0">
                {filtered_contributors.length === 0 ? (
                  <li className="text-base-content/60 px-3 py-4 text-center text-sm">
                    No member found.
                  </li>
                ) : (
                  filtered_contributors.map((c) => {
                    const isSelected = selected.includes(c)
                    return (
                      <li key={c}>
                        <button
                          type="button"
                          onClick={(event) => {
                            if (isSelected) remove(c)
                            else add(c)
                            close_daisy_dropdown(event.currentTarget)
                          }}
                        >
                          <CheckIcon
                            className={cn('size-4', isSelected ? 'opacity-100' : 'opacity-0')}
                          />
                          @{c}
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="dropdown">
          <Button type="button" tabIndex={0} className="btn-outline btn-sm h-7 gap-1">
            <UsersIcon className="size-3.5" />
            Teams
            {teams.length > 0 ? (
              <span className="text-base-content/60">({teams.length})</span>
            ) : null}
          </Button>
          <div
            tabIndex={-1}
            className="dropdown-content bg-base-100 rounded-box z-50 w-72 p-2 shadow"
          >
            <Input
              value={team_query}
              onChange={(event) => set_team_query(event.target.value)}
              placeholder="Search teams…"
              className="input-sm mb-2"
            />
            <ul className="menu max-h-72 overflow-y-auto p-0">
              {filtered_teams.length === 0 ? (
                <li className="text-base-content/60 px-3 py-4 text-center text-sm">
                  No saved teams yet.
                </li>
              ) : (
                filtered_teams.map((team) => (
                  <li key={team.id}>
                    <div className="flex-col items-start gap-1.5 py-2">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2"
                        onClick={(event) => {
                          applyTeam(team)
                          close_daisy_dropdown(event.currentTarget)
                        }}
                      >
                        <CheckIcon
                          className={cn(
                            'size-4 shrink-0',
                            activeTeamId === team.id ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <span className="truncate font-medium">{team.name}</span>
                        <span className="text-base-content/60 text-xs">{team.members.length}</span>
                      </button>
                      <div className="flex gap-1 pl-6">
                        <button
                          type="button"
                          className="text-base-content/60 hover:bg-base-200 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            openManage(team)
                            close_daisy_dropdown(e.currentTarget)
                          }}
                        >
                          <PencilIcon className="size-3" />
                          Manage members
                        </button>
                        <button
                          type="button"
                          className="text-base-content/60 hover:bg-error/10 hover:text-error inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            void handleDelete(team.id)
                            close_daisy_dropdown(e.currentTarget)
                          }}
                        >
                          <Trash2Icon className="size-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))
              )}
              {!teamMode && selected.length > 0 ? (
                <li>
                  <button
                    type="button"
                    onClick={(event) => {
                      setTeamName('')
                      setSaveError(null)
                      setSaveOpen(true)
                      close_daisy_dropdown(event.currentTarget)
                    }}
                  >
                    <SaveIcon className="size-4" />
                    Save current selection…
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        {!teamMode && selected.length > 0 && (
          <>
            <Button
              type="button"
              className="btn-outline btn-sm h-7 gap-1"
              onClick={() => {
                setTeamName('')
                setSaveError(null)
                setSaveOpen(true)
              }}
            >
              <SaveIcon className="size-3.5" />
              Save team
            </Button>
            <Button type="button" className="btn-ghost btn-sm h-7" onClick={clear}>
              Clear
            </Button>
          </>
        )}

        {teamMode && (
          <>
            <Button
              type="button"
              className="btn-outline btn-sm h-7 gap-1"
              onClick={() => activeTeam && openManage(activeTeam)}
            >
              <PencilIcon className="size-3.5" />
              Manage members
            </Button>
            <Button type="button" className="btn-ghost btn-sm h-7" onClick={clear}>
              Clear
            </Button>
          </>
        )}
      </div>

      <Modal open={saveOpen} on_close={() => setSaveOpen(false)} box_className="max-w-md">
        <h3 className="font-display text-lg font-semibold">Save team</h3>
        <p className="text-base-content/60 mt-1 text-sm">
          Store this member selection so you can reuse it later.
        </p>
        <div className="mt-4 space-y-3">
          <label className="form-control w-full">
            <span className="label">Team name</span>
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
          </label>
          <p className="text-base-content/60 text-sm">
            {selected.length} member{selected.length === 1 ? '' : 's'}:{' '}
            {selected.map((m) => `@${m}`).join(', ')}
          </p>
          {saveError ? <p className="text-error text-sm">{saveError}</p> : null}
        </div>
        <div className="modal-action">
          <Button type="button" className="btn-outline" onClick={() => setSaveOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-primary"
            disabled={saving || !teamName.trim() || selected.length === 0}
            onClick={() => void handleSaveNew()}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>

      <Modal open={manageOpen} on_close={() => setManageOpen(false)} box_className="max-w-md">
        <h3 className="font-display text-lg font-semibold">Manage members</h3>
        <p className="text-base-content/60 mt-1 text-sm">
          Add or remove people from <strong>{manageTeam?.name ?? 'this team'}</strong>.
        </p>
        <div className="mt-4 space-y-4">
          <label className="form-control w-full">
            <span className="label">Team name</span>
            <Input
              id="manage-team-name"
              value={manageName}
              onChange={(e) => setManageName(e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <span className="label">Members</span>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-base-300 p-2">
              {managePool.length === 0 ? (
                <p className="text-base-content/60 px-2 py-3 text-sm">
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
                        'hover:bg-base-200 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                        checked && 'bg-base-200',
                      )}
                    >
                      <CheckIcon className={cn('size-4', checked ? 'opacity-100' : 'opacity-0')} />@
                      {login}
                    </button>
                  )
                })
              )}
            </div>
            <p className="text-base-content/60 text-xs">{manageMembers.length} selected</p>
          </div>
          {saveError ? <p className="text-error text-sm">{saveError}</p> : null}
        </div>
        <div className="modal-action">
          <Button type="button" className="btn-outline" onClick={() => setManageOpen(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            className="btn-primary"
            disabled={saving || !manageName.trim() || manageMembers.length === 0}
            onClick={() => void handleManageSave()}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export const MemberFilter = connector(Wrapper)

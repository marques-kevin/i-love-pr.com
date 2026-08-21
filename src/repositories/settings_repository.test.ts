import { describe, expect, it } from 'vitest'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/business-hours'
import { create_memory_repositories } from './memory_repositories'

describe('create_memory_repositories settings', () => {
  it('saves and reads settings', async () => {
    const repositories = create_memory_repositories()
    const saved = await repositories.settings.save({
      token: 'ghp_test',
      repos: ['acme/app'],
      sync_interval_hours: 12,
      business_hours: { ...DEFAULT_BUSINESS_HOURS, enabled: true },
    })

    expect(saved.token).toBe('ghp_test')
    expect(saved.repos).toEqual(['acme/app'])
    expect(saved.business_hours.enabled).toBe(true)

    const loaded = await repositories.settings.get()
    expect(loaded?.token).toBe('ghp_test')
  })

  it('saves dashboard layout on the active tab', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const next = await repositories.settings.save_dashboard_layout([
      { instance_id: '1', widget_id: 'cycle_time' },
    ])
    expect(next.dashboards[0].layout).toEqual([{ instance_id: '1', widget_id: 'cycle_time' }])
  })

  it('creates a named dashboard and switches to it', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const next = await repositories.settings.create_dashboard('Reviewers')
    expect(next.dashboards).toHaveLength(2)
    expect(next.dashboards[1].name).toBe('Reviewers')
    expect(next.dashboards[1].repo_full_name).toBe('a/b')
    expect(next.dashboards[1].layout).toEqual([])
    expect(next.dashboards[1].members).toEqual([])
    expect(next.dashboards[1].period_key).toBe('30d')
    expect(next.active_dashboard_id).toBe(next.dashboards[1].id)
  })

  it('saves filters on a specific dashboard tab', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const created = await repositories.settings.create_dashboard('Reviewers')
    const tab_id = created.dashboards[1].id
    const next = await repositories.settings.save_dashboard_filters({
      dashboard_id: tab_id,
      members: ['alice'],
      period_key: '7d',
      custom_from: '',
      custom_to: '',
      hide_test_files: true,
    })
    expect(next.dashboards[1].members).toEqual(['alice'])
    expect(next.dashboards[1].period_key).toBe('7d')
    expect(next.dashboards[1].hide_test_files).toBe(true)
    expect(next.dashboards[0].members).toEqual([])
    expect(next.dashboards[0].period_key).toBe('30d')
  })

  it('renames and deletes a dashboard', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['a/b'] })
    const created = await repositories.settings.create_dashboard('Reviewers')
    const renamed = await repositories.settings.rename_dashboard({
      dashboard_id: created.dashboards[1].id,
      name: 'Authors',
    })
    expect(renamed.dashboards[1].name).toBe('Authors')

    const deleted = await repositories.settings.delete_dashboard(created.dashboards[1].id)
    expect(deleted.dashboards).toHaveLength(1)
    expect(deleted.active_dashboard_id).toBe(deleted.dashboards[0].id)

    await expect(repositories.settings.delete_dashboard(deleted.dashboards[0].id)).rejects.toThrow(
      /last dashboard/i,
    )
  })

  it('removes a repository and its local data', async () => {
    const repositories = create_memory_repositories()
    await repositories.settings.save({ token: 't', repos: ['acme/app', 'acme/other'] })
    await repositories.pull_requests.put_many([
      {
        id: 'pr-1',
        repo_full_name: 'acme/app',
        number: 1,
        title: 'One',
        author: 'alice',
        state: 'MERGED',
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-02T00:00:00.000Z',
        closed_at: '2024-01-02T00:00:00.000Z',
        merged_at: '2024-01-02T00:00:00.000Z',
        ready_for_review_at: null,
        first_review_requested_at: null,
        additions: 1,
        deletions: 0,
        changed_files: 1,
        commits_count: 1,
        comments_count: 0,
        labels: [],
      },
    ])
    await repositories.pr_facts.put_many([
      {
        _version: 1,
        pr_id: 'pr-1',
        repo_full_name: 'acme/app',
        author: 'alice',
        state: 'MERGED',
        created_at: '2024-01-01T00:00:00.000Z',
        merged_at: '2024-01-02T00:00:00.000Z',
        pr_number: 1,
        title: 'One',
        request_review_at: '2024-01-01T00:00:00.000Z',
        first_approved_at: null,
        is_bot: false,
        lines_added: 1,
        lines_deleted: 0,
        lines_changed: 1,
        review_rounds: 0,
        cycle: {
          time_from_creation_to_asked_for_review: null,
          time_from_creation_to_merged: 1,
          time_from_creation_to_approved: null,
          time_from_asked_for_review_to_approved: null,
          time_from_asked_for_review_to_first_review: null,
        },
      },
    ])

    const next = await repositories.settings.remove_repository('acme/app')
    expect(next.repos).toEqual(['acme/other'])
    expect(next.active_repo).toBe('acme/other')
    expect(await repositories.pull_requests.count_by_repo('acme/app')).toBe(0)
    expect(await repositories.pr_facts.list_by_repos(['acme/app'])).toEqual([])
    expect(repositories.sync_state.get('acme/app')).resolves.toBeUndefined()
  })
})

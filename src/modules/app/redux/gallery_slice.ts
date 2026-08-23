import { createSlice } from '@reduxjs/toolkit'
import { compute_gallery_row_stats, type GalleryRowStats } from '@/lib/gallery_row_stats'
import { create_app_async_thunk } from '@/store/create_app_async_thunk'

export type GalleryState = {
  stats_by_repo: Record<string, GalleryRowStats>
  loading: boolean
}

const initial_state: GalleryState = {
  stats_by_repo: {},
  loading: false,
}

export const load_gallery_stats = create_app_async_thunk<Record<string, GalleryRowStats>, void>(
  'gallery/load_gallery_stats',
  async (_, { extra, getState }) => {
    const settings = getState().settings.settings
    const repos = settings?.repos ?? []
    if (repos.length === 0) return {}

    const facts = await extra.repositories.pr_facts.list_by_repos(repos)
    const facts_by_repo = new Map<string, typeof facts>()
    for (const fact of facts) {
      const list = facts_by_repo.get(fact.repo_full_name) ?? []
      list.push(fact)
      facts_by_repo.set(fact.repo_full_name, list)
    }

    const now = new Date()
    const stats_by_repo: Record<string, GalleryRowStats> = {}
    for (const repo of repos) {
      stats_by_repo[repo] = compute_gallery_row_stats(facts_by_repo.get(repo) ?? [], now)
    }
    return stats_by_repo
  },
)

const gallery_slice = createSlice({
  name: 'gallery',
  initialState: initial_state,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(load_gallery_stats.pending, (state) => {
        state.loading = true
      })
      .addCase(load_gallery_stats.fulfilled, (state, action) => {
        state.loading = false
        state.stats_by_repo = action.payload
      })
      .addCase(load_gallery_stats.rejected, (state) => {
        state.loading = false
      })
  },
})

export const gallery_reducer = gallery_slice.reducer

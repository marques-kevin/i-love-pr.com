import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AppLocale } from '@/lib/i18n'
import { detect_locale, normalize_locale, resolve_locale } from '@/lib/i18n'
import type { AppSettings } from '@/lib/types'
import { create_app_async_thunk } from '@/store/create_app_async_thunk'

export type I18nState = {
  locale: AppLocale
}

const initial_state: I18nState = {
  locale: detect_locale(),
}

export const change_locale = create_app_async_thunk<AppLocale, AppLocale>(
  'i18n/change_locale',
  async (locale, { extra }) => {
    const next = normalize_locale(locale)
    const settings = await extra.repositories.settings.get()
    if (settings) {
      await extra.repositories.settings.save_locale(next)
    }
    return next
  },
)

const i18n_slice = createSlice({
  name: 'i18n',
  initialState: initial_state,
  reducers: {
    set_locale(state, action: PayloadAction<AppLocale>) {
      state.locale = normalize_locale(action.payload)
    },
    hydrate_locale_from_settings(_state, action: PayloadAction<AppSettings | null>) {
      // Saved preference wins; otherwise re-detect from the browser (EN fallback).
      return { locale: resolve_locale(action.payload?.locale) }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(change_locale.fulfilled, (state, action) => {
      state.locale = action.payload
    })
  },
})

export const { set_locale, hydrate_locale_from_settings } = i18n_slice.actions
export const i18n_reducer = i18n_slice.reducer

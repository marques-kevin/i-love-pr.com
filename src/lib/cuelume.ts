import { bind, play, setEnabled, setVolume, type SoundName } from 'cuelume'

const SOUND_ENABLED_KEY = 'ilovepr.sound_enabled'

export function is_sound_enabled(): boolean {
  if (typeof localStorage === 'undefined') return true
  const raw = localStorage.getItem(SOUND_ENABLED_KEY)
  if (raw == null) return true
  return raw === '1' || raw === 'true'
}

export function set_sound_enabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SOUND_ENABLED_KEY, enabled ? '1' : '0')
  }
  setEnabled(enabled)
}

/** Call once at app boot — safe to run before first user gesture. */
export function init_cuelume(): void {
  setVolume(0.55)
  setEnabled(is_sound_enabled())
  bind()
}

export function play_sound(name: SoundName, options?: { volume?: number }): void {
  play(name, options)
}

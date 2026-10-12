/**
 * Theme preference shared by the pre-paint script in the root layout and ThemeToggle.
 * Only the display choice is stored; no user data.
 *
 * Exposed as a tiny external store (subscribe + snapshot) so components can read it
 * with useSyncExternalStore: the server renders "system", the client renders the saved
 * value, and React reconciles the two without a hydration mismatch.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'daily_path_theme';

/**
 * Runs before first paint so a saved dark preference never flashes light.
 * Kept as a string because it is inlined into <head> ahead of hydration.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

const listeners = new Set<() => void>();

// Fallback when storage is blocked (private mode), so the toggle still works for this session.
let memoryPreference: ThemePreference | null = null;

function isPreference(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark';
}

function applyThemeClass(pref: ThemePreference): void {
  const isDark =
    pref === 'dark' ||
    (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

/** Snapshot for useSyncExternalStore. Returns a string, so it is stable between calls. */
export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isPreference(value) ? value : 'system';
  } catch {
    return memoryPreference ?? 'system';
  }
}

/** Server snapshot: storage is unavailable during SSR, so render the neutral choice. */
export function readServerThemePreference(): ThemePreference {
  return 'system';
}

/** Subscribe for useSyncExternalStore. Also follows changes made in other tabs. */
export function subscribeThemePreference(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY && e.key !== null) return;
    applyThemeClass(readThemePreference());
    onChange();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function applyThemePreference(pref: ThemePreference): void {
  memoryPreference = pref;
  try {
    if (pref === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Still applied for this session via memoryPreference.
  }
  applyThemeClass(pref);
  listeners.forEach((listener) => listener());
}

/** Re-applies "system" when the OS theme changes; used while the preference is "system". */
export function syncSystemTheme(): void {
  applyThemeClass('system');
}

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import {
  applyThemePreference,
  readServerThemePreference,
  readThemePreference,
  subscribeThemePreference,
  syncSystemTheme,
  ThemePreference,
} from '@/lib/theme';

const NEXT: Record<ThemePreference, ThemePreference> = {
  system: 'light',
  light: 'dark',
  dark: 'system',
};

const LABEL: Record<ThemePreference, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

/** Cycles System -> Light -> Dark. The pre-paint script in the layout applies the saved choice on load. */
export default function ThemeToggle() {
  const pref = useSyncExternalStore(
    subscribeThemePreference,
    readThemePreference,
    readServerThemePreference
  );

  // In system mode, follow OS changes live. Only touches the DOM, never React state.
  useEffect(() => {
    if (pref !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', syncSystemTheme);
    return () => media.removeEventListener('change', syncSystemTheme);
  }, [pref]);

  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => applyThemePreference(NEXT[pref])}
      title={`${LABEL[pref]} (click to change)`}
      aria-label={`${LABEL[pref]}. Switch to ${LABEL[NEXT[pref]].toLowerCase()}`}
      className="w-9 h-9 rounded-full bg-sunk text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

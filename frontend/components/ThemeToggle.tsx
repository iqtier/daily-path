'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { applyThemePreference, readThemePreference, ThemePreference } from '@/lib/theme';

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
  // Starts as "system" on the server; the real value is read after mount to avoid a hydration mismatch.
  const [pref, setPref] = useState<ThemePreference>('system');

  useEffect(() => {
    setPref(readThemePreference());
  }, []);

  // In system mode, follow OS changes live.
  useEffect(() => {
    if (pref !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyThemePreference('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [pref]);

  const cycle = () => {
    const next = NEXT[pref];
    setPref(next);
    applyThemePreference(next);
  };

  const Icon = pref === 'light' ? Sun : pref === 'dark' ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      title={`${LABEL[pref]} (click to change)`}
      aria-label={`${LABEL[pref]}. Switch to ${LABEL[NEXT[pref]].toLowerCase()}`}
      className="w-9 h-9 rounded-full bg-sunk text-ink-muted hover:text-ink flex items-center justify-center transition-colors"
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

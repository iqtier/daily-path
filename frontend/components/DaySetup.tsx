'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DottedTrail } from '@/components/icons';
import { ApiError, generateToday } from '@/lib/api';
import { DailyPlanResponse } from '@/lib/types';

interface DaySetupProps {
  date: string;
  defaultHours: number;
  onGenerated: (plan: DailyPlanResponse) => void;
}

const QUICK_PICKS = [1, 2, 3, 4, 6];
const MIN_HOURS = 0.25;
const MAX_HOURS = 16;

// Generation can take up to a minute; rotating lines show it is still working.
const BUILDING_LINES = [
  'Reading your goals…',
  "Checking what's due soon…",
  'Sizing steps to fit your time…',
  'Picking a great first move…',
];

/** Shown when today has no plan yet. Collects available hours and triggers plan generation. */
export default function DaySetup({ date, defaultHours, onGenerated }: DaySetupProps) {
  const [hours, setHours] = useState(defaultHours);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineIndex, setLineIndex] = useState(0);

  const isValid = hours >= MIN_HOURS && hours <= MAX_HOURS;
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Only advances the line while generating; the reset to the first line happens in handleGenerate.
  useEffect(() => {
    if (!loading) return;
    const id = window.setInterval(
      () => setLineIndex((i) => (i + 1) % BUILDING_LINES.length),
      2600
    );
    return () => window.clearInterval(id);
  }, [loading]);

  async function handleGenerate() {
    // A retry after an error should start again from the first message.
    setLineIndex(0);
    setLoading(true);
    setError(null);
    try {
      onGenerated(await generateToday(hours));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't build your list. Give it another try.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
      <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-muted">
        Fresh day, fresh start
      </p>
      <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">{dateLabel}</h1>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 24 }}
        className="mt-8 rounded-3xl bg-surface p-5 sm:p-7 shadow-soft"
      >
        <label htmlFor="hours" className="block text-lg sm:text-xl font-extrabold">
          How much time are we working with today?
        </label>
        <p className="mt-1 text-sm text-ink-muted">
          Pick a rough number. We&apos;ll size today&apos;s steps to fit.
        </p>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Quick picks">
          {QUICK_PICKS.map((h) => {
            const selected = hours === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                disabled={loading}
                aria-pressed={selected}
                className={`min-w-14 rounded-full px-4 py-2.5 text-sm font-extrabold tabular-nums transition ${
                  selected
                    ? 'bg-brand-gradient text-on-brand shadow-[0_8px_18px_-8px_color-mix(in_oklab,var(--brand)_80%,transparent)] scale-105'
                    : 'bg-sunk text-ink hover:bg-line'
                }`}
              >
                {h}h
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            id="hours"
            type="number"
            min={MIN_HOURS}
            max={MAX_HOURS}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            disabled={loading}
            aria-invalid={!isValid}
            aria-describedby={!isValid ? 'hours-error' : undefined}
            className="w-28 rounded-2xl border border-line bg-canvas px-3.5 py-2.5 text-base font-bold tabular-nums text-ink"
          />
          <span className="text-ink-muted font-semibold">hours</span>
        </div>

        {!isValid && (
          <p id="hours-error" className="mt-2 text-sm font-semibold text-danger">
            Enter between {MIN_HOURS} and {MAX_HOURS} hours.
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !isValid}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-gradient px-4 py-3.5 font-extrabold text-on-brand shadow-[0_12px_24px_-10px_color-mix(in_oklab,var(--brand)_80%,transparent)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? (
            <span
              aria-hidden="true"
              className="w-4 h-4 rounded-full border-2 border-on-brand/35 border-t-on-brand animate-spin"
            />
          ) : (
            <DottedTrail className="w-5 h-5" />
          )}
          {loading ? 'Building your day…' : 'Build my day'}
        </button>

        {loading && (
          <div className="mt-4 text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              <motion.p
                key={lineIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-sm font-semibold text-ink"
              >
                {BUILDING_LINES[lineIndex]}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1 text-xs text-ink-muted">This can take up to a minute.</p>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 rounded-2xl bg-danger-soft p-3.5 text-sm font-semibold text-danger">
            {error}
          </div>
        )}
      </motion.div>
    </main>
  );
}

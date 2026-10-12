'use client';

import { useState } from 'react';
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

/** Shown when today has no plan yet. Collects available hours and triggers plan generation. */
export default function DaySetup({ date, defaultHours, onGenerated }: DaySetupProps) {
  const [hours, setHours] = useState(defaultHours);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = hours >= MIN_HOURS && hours <= MAX_HOURS;
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      onGenerated(await generateToday(hours));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">Plan your day</p>
      <h1 className="mt-1 text-3xl font-bold text-neutral-900">{dateLabel}</h1>

      <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <label htmlFor="hours" className="block text-lg font-semibold text-neutral-900">
          How much time do you have today?
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_PICKS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHours(h)}
              disabled={loading}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                hours === h ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              {h}h
            </button>
          ))}
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
            className="w-28 rounded-xl border border-neutral-300 px-3 py-2 text-base"
          />
          <span className="text-neutral-600">hours</span>
        </div>

        {!isValid && (
          <p className="mt-2 text-sm text-red-600">
            Enter between {MIN_HOURS} and {MAX_HOURS} hours.
          </p>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !isValid}
          className="mt-6 w-full rounded-xl bg-neutral-900 px-4 py-3 font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Building your list...' : "Build today's list"}
        </button>

        {loading && (
          <p className="mt-3 text-center text-sm text-neutral-500">
            This can take up to a minute.
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
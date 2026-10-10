'use client';

import { useState, useEffect, useCallback } from 'react';

const TIMER_STORAGE_KEY_PREFIX = 'daily_path_task_timer_';

export interface TimerState {
  taskId: string;
  secondsSoFar: number;
  isPaused: boolean;
  lastResumedAt: number | null; // Unix timestamp in ms
  hasEverStarted: boolean;
}

/**
 * Computes initial snapshot from localStorage
 */
function getInitialTimerState(taskId: string | null): {
  displaySeconds: number;
  isPaused: boolean;
  hasStarted: boolean;
} {
  if (!taskId || typeof window === 'undefined') {
    return { displaySeconds: 0, isPaused: true, hasStarted: false };
  }
  try {
    const saved = localStorage.getItem(`${TIMER_STORAGE_KEY_PREFIX}${taskId}`);
    if (saved) {
      const state: TimerState = JSON.parse(saved);
      if (!state.hasEverStarted) {
        return { displaySeconds: 0, isPaused: true, hasStarted: false };
      }
      if (state.isPaused || state.lastResumedAt === null) {
        return {
          displaySeconds: state.secondsSoFar,
          isPaused: true,
          hasStarted: true,
        };
      }
      const additional = Math.max(
        0,
        Math.floor((Date.now() - state.lastResumedAt) / 1000)
      );
      return {
        displaySeconds: state.secondsSoFar + additional,
        isPaused: false,
        hasStarted: true,
      };
    }
  } catch (e) {
    console.error('Failed to read timer state:', e);
  }
  return { displaySeconds: 0, isPaused: true, hasStarted: false };
}

/**
 * useTaskTimer
 * Custom hook managing the persistent stopwatch for the currently active daily task.
 * Persists running and paused states in localStorage so page reloads do not reset the timer.
 */
export function useTaskTimer(taskId: string | null) {
  const [displaySeconds, setDisplaySeconds] = useState<number>(
    () => getInitialTimerState(taskId).displaySeconds
  );
  const [isPaused, setIsPaused] = useState<boolean>(
    () => getInitialTimerState(taskId).isPaused
  );
  const [hasStarted, setHasStarted] = useState<boolean>(
    () => getInitialTimerState(taskId).hasStarted
  );

  const storageKey = taskId ? `${TIMER_STORAGE_KEY_PREFIX}${taskId}` : null;

  // Live interval tick when timer is actively running
  useEffect(() => {
    if (!hasStarted || isPaused || !storageKey) return;

    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const state: TimerState = JSON.parse(saved);
          if (!state.isPaused && state.lastResumedAt !== null) {
            const additional = Math.max(
              0,
              Math.floor((Date.now() - state.lastResumedAt) / 1000)
            );
            setDisplaySeconds(state.secondsSoFar + additional);
          }
        }
      } catch (e) {
        console.error('Error updating timer tick:', e);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [hasStarted, isPaused, storageKey]);

  /**
   * Start stopwatch from 0:00
   */
  const startTimer = useCallback(() => {
    if (!taskId || !storageKey) return;
    const now = Date.now();
    const newState: TimerState = {
      taskId,
      secondsSoFar: 0,
      isPaused: false,
      lastResumedAt: now,
      hasEverStarted: true,
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(newState));
    } catch {}
    setDisplaySeconds(0);
    setIsPaused(false);
    setHasStarted(true);
  }, [taskId, storageKey]);

  /**
   * Pause stopwatch (freezes time, button switches to Resume)
   */
  const pauseTimer = useCallback(() => {
    if (!taskId || !storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      const prev: TimerState = saved
        ? JSON.parse(saved)
        : {
            taskId,
            secondsSoFar: displaySeconds,
            isPaused: false,
            lastResumedAt: null,
            hasEverStarted: true,
          };

      const additional =
        prev.lastResumedAt !== null
          ? Math.max(0, Math.floor((Date.now() - prev.lastResumedAt) / 1000))
          : 0;
      const liveElapsed = prev.secondsSoFar + additional;

      const newState: TimerState = {
        taskId,
        secondsSoFar: liveElapsed,
        isPaused: true,
        lastResumedAt: null,
        hasEverStarted: true,
      };

      localStorage.setItem(storageKey, JSON.stringify(newState));
      setDisplaySeconds(liveElapsed);
      setIsPaused(true);
    } catch (e) {
      console.error('Error pausing timer:', e);
    }
  }, [taskId, storageKey, displaySeconds]);

  /**
   * Resume stopwatch from where it stopped
   */
  const resumeTimer = useCallback(() => {
    if (!taskId || !storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      const prev: TimerState = saved
        ? JSON.parse(saved)
        : {
            taskId,
            secondsSoFar: displaySeconds,
            isPaused: true,
            lastResumedAt: null,
            hasEverStarted: true,
          };

      const now = Date.now();
      const newState: TimerState = {
        ...prev,
        isPaused: false,
        lastResumedAt: now,
        hasEverStarted: true,
      };

      localStorage.setItem(storageKey, JSON.stringify(newState));
      setIsPaused(false);
    } catch (e) {
      console.error('Error resuming timer:', e);
    }
  }, [taskId, storageKey, displaySeconds]);

  /**
   * Stops timer upon task completion and returns the recorded seconds.
   * Returns undefined if the timer was never started.
   */
  const stopAndCollectSeconds = useCallback((): number | undefined => {
    if (!taskId || !storageKey) return undefined;
    if (!hasStarted) {
      try {
        localStorage.removeItem(storageKey);
      } catch {}
      return undefined;
    }

    let finalSeconds = displaySeconds;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state: TimerState = JSON.parse(saved);
        const additional =
          !state.isPaused && state.lastResumedAt !== null
            ? Math.max(0, Math.floor((Date.now() - state.lastResumedAt) / 1000))
            : 0;
        finalSeconds = state.secondsSoFar + additional;
      }
      localStorage.removeItem(storageKey);
    } catch {}

    setDisplaySeconds(0);
    setIsPaused(true);
    setHasStarted(false);
    return Math.max(0, finalSeconds);
  }, [taskId, storageKey, hasStarted, displaySeconds]);

  return {
    displaySeconds,
    isPaused,
    hasStarted,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndCollectSeconds,
  };
}

'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Check,
  Flag,
  Lock,
  Pause,
  Play,
  Tag,
  Timer as TimerIcon,
} from 'lucide-react';
import { DailyTaskItem } from '@/lib/types';
import {
  formatStopwatch,
  secondsToMinutes,
  getDurationComparison,
} from '@/lib/formatters';
import { useTaskTimer } from '@/hooks/use-task-timer';
import { StopwatchPlus } from '@/components/icons';
import { ACCENT_CLASS, AccentKey } from '@/lib/category-theme';
import { burstPointFrom, celebrateTask } from '@/lib/celebrate';

/** Marks extra tasks added during bonus time. */
function BonusBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-warn bg-warn-soft px-2 py-0.5 rounded-full">
      <StopwatchPlus className="w-3 h-3" />
      <span>Bonus</span>
    </span>
  );
}

/** Linked goal or deadline, tinted with the task's accent. */
function LinkTag({ task }: { task: DailyTaskItem }) {
  if (!task.linkedTo) return null;
  const Icon = task.linkedTo.type === 'futureTask' ? Flag : Tag;
  return (
    <span className="inline-flex items-center gap-1.5 max-w-full text-xs font-bold text-accent-ink bg-accent/15 px-2.5 py-1 rounded-full">
      <Icon className="w-3 h-3 shrink-0" />
      <span className="truncate max-w-[200px]">{task.linkedTo.title}</span>
    </span>
  );
}

interface TaskCardProps {
  task: DailyTaskItem;
  isFirstUnfinished: boolean;
  onComplete: (taskId: string, timeSpentSeconds?: number) => Promise<void>;
  accent?: AccentKey;
}

/**
 * A daily task in one of three states:
 * 1. Locked: blurred placeholder with no task text, so upcoming steps stay hidden.
 * 2. Completed: shows actual vs suggested time (suggested is only known after completion).
 * 3. Current: full details, stopwatch, and Mark done.
 */
export default function TaskCard({
  task,
  isFirstUnfinished,
  onComplete,
  accent = 'other',
}: TaskCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const doneButtonRef = useRef<HTMLButtonElement>(null);
  // stopAndCollectSeconds clears the saved timer, so keep the value in case the save fails and is retried.
  const collectedSecondsRef = useRef<number | undefined>(undefined);

  const {
    displaySeconds,
    isPaused,
    hasStarted,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndCollectSeconds,
  } = useTaskTimer(isFirstUnfinished ? task.id : null);

  const handleMarkDone = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSaveError(false);

    // Captured before the save, since this card unmounts once the next step unlocks.
    const burst = doneButtonRef.current ? burstPointFrom(doneButtonRef.current) : null;
    const recordedSeconds = hasStarted
      ? stopAndCollectSeconds()
      : (collectedSecondsRef.current ?? stopAndCollectSeconds());
    collectedSecondsRef.current = recordedSeconds;

    try {
      await onComplete(task.id, recordedSeconds);
      if (burst) void celebrateTask(burst);
    } catch (err) {
      console.error('Error completing task:', err);
      setSaveError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // LOCKED: no title or text, by design
  // ---------------------------------------------------------------------------
  if (task.isLocked) {
    return (
      <div
        aria-label={`Step ${task.order}, locked`}
        className="relative overflow-hidden rounded-3xl border border-dashed border-line bg-surface/50 p-5 select-none"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 shrink-0 rounded-full bg-sunk text-ink-muted flex items-center justify-center text-xs font-bold">
            {task.order}
          </span>
          <div aria-hidden="true" className="flex-1 space-y-2 opacity-60 blur-[3px]">
            <div className="h-3.5 w-3/4 bg-trail rounded-full" />
            <div className="h-3 w-1/2 bg-trail/70 rounded-full" />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-line text-ink-muted text-xs font-bold shadow-soft">
            <Lock className="w-3.5 h-3.5" />
            Unlocks after this one
          </span>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // COMPLETED
  // ---------------------------------------------------------------------------
  if (task.isCompleted) {
    const hasRecordedTimer =
      task.timeSpentSeconds !== undefined && task.timeSpentSeconds > 0;
    const comparison =
      hasRecordedTimer && task.estimatedMinutes !== undefined
        ? getDurationComparison(task.timeSpentSeconds!, task.estimatedMinutes)
        : null;

    return (
      <motion.article
        initial={{ opacity: 0, y: -8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className={`${ACCENT_CLASS[accent]} rounded-3xl border border-line bg-surface/60 p-4 sm:p-5`}
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-good-soft text-good flex items-center justify-center">
            <Check className="w-4 h-4 stroke-[3]" />
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-ink-muted">Step {task.order}</span>
              {task.isBonus && <BonusBadge />}
              <LinkTag task={task} />
            </div>

            <h3 className="text-sm sm:text-base font-bold text-ink-muted line-through decoration-ink-muted/40">
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs sm:text-sm text-ink-muted mt-0.5">{task.description}</p>
            )}

            {/* Suggested time is only revealed once the task is done. */}
            {task.estimatedMinutes !== undefined && (
              <div className="mt-3 pt-2.5 border-t border-line flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-muted tabular-nums">
                {hasRecordedTimer && (
                  <span>
                    You: <strong className="text-ink">{secondsToMinutes(task.timeSpentSeconds!)} min</strong>
                  </span>
                )}
                <span>
                  Suggested: <strong className="text-ink">{task.estimatedMinutes} min</strong>
                </span>
                {comparison && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                      comparison.variant === 'faster'
                        ? 'bg-good-soft text-good'
                        : comparison.variant === 'longer'
                          ? 'bg-warn-soft text-warn'
                          : 'bg-sunk text-ink'
                    }`}
                  >
                    {comparison.label}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.article>
    );
  }

  // ---------------------------------------------------------------------------
  // CURRENT
  // ---------------------------------------------------------------------------
  const isRunning = hasStarted && !isPaused;

  return (
    <motion.article
      // Mounts when the previous step is finished, so this is the "unlock" moment.
      initial={{ opacity: 0, y: 16, scale: 0.96, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className={`${ACCENT_CLASS[accent]} relative rounded-3xl bg-surface p-5 sm:p-6 shadow-glow`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 rounded-3xl pointer-events-none bg-[radial-gradient(120%_80%_at_100%_0%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_60%)]"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-accent-strong text-on-accent flex items-center justify-center text-xs font-extrabold">
            {task.order}
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Current focus
          </span>
          {task.isBonus && <BonusBadge />}
          <span className="sm:ml-auto max-w-full">
            <LinkTag task={task} />
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-snug text-balance">
          {task.title}
        </h2>

        {task.description && (
          <p className="text-sm sm:text-base text-ink-muted mt-1.5 leading-relaxed">
            {task.description}
          </p>
        )}

        {task.reason && (
          <div className="mt-4 p-3.5 rounded-2xl bg-sunk text-sm text-ink-muted">
            <strong className="text-ink">Why this helps:</strong> {task.reason}
          </div>
        )}

        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              role="timer"
              aria-label="Time on this task"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-base font-bold tabular-nums transition-colors ${
                isRunning
                  ? 'bg-ink text-canvas'
                  : hasStarted
                    ? 'bg-warn-soft text-warn'
                    : 'bg-sunk text-ink-muted'
              }`}
            >
              <TimerIcon className={`w-4 h-4 ${isRunning ? 'animate-pulse' : ''}`} />
              <span>{formatStopwatch(displaySeconds)}</span>
              {hasStarted && isPaused && (
                <span className="text-[10px] uppercase tracking-wider font-extrabold">Paused</span>
              )}
            </div>

            {!hasStarted ? (
              <button
                type="button"
                onClick={startTimer}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-ink bg-sunk hover:bg-line px-3.5 py-2 rounded-2xl transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Start
              </button>
            ) : isPaused ? (
              <button
                type="button"
                onClick={resumeTimer}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-good bg-good-soft hover:brightness-95 px-3.5 py-2 rounded-2xl transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Resume
              </button>
            ) : (
              <button
                type="button"
                onClick={pauseTimer}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-warn bg-warn-soft hover:brightness-95 px-3.5 py-2 rounded-2xl transition"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                Pause
              </button>
            )}
          </div>

          <button
            ref={doneButtonRef}
            type="button"
            onClick={handleMarkDone}
            disabled={isSubmitting}
            className="sm:ml-auto w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent-gradient text-on-accent font-extrabold text-sm px-5 py-3 rounded-2xl shadow-[0_8px_18px_-8px_color-mix(in_oklab,var(--accent-strong)_80%,transparent)] transition-transform hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isSubmitting ? 'Saving…' : 'Mark done'}
          </button>
        </div>

        {saveError && (
          <p role="alert" className="mt-3 text-sm font-semibold text-danger">
            That didn&apos;t save. Check your connection and tap Mark done again.
          </p>
        )}
      </div>
    </motion.article>
  );
}

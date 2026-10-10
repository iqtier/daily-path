'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  Lock,
  Play,
  Pause,
  Timer as TimerIcon,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';
import { DailyTaskItem } from '@/lib/types';
import {
  formatStopwatch,
  secondsToMinutes,
  getDurationComparison,
} from '@/lib/formatters';
import { useTaskTimer } from '@/hooks/use-task-timer';

/**
 * Small "Bonus" pill shown on tasks added during bonus time
 */
function BonusBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
      <Sparkles className="w-3 h-3" />
      <span>Bonus</span>
    </span>
  );
}

interface TaskCardProps {
  task: DailyTaskItem;
  isFirstUnfinished: boolean;
  onComplete: (taskId: string, timeSpentSeconds?: number) => Promise<void>;
}

/**
 * TaskCard Component
 * Displays a daily task in one of three visual states:
 * 1. Finished: checked & faded, showing comparison of actual time vs AI suggested time.
 * 2. Active (first unfinished): full details, stopwatch timer controls, and "Mark done" action.
 * 3. Locked: blurred placeholder with lock icon, no text shown to protect upcoming focus.
 */
export default function TaskCard({
  task,
  isFirstUnfinished,
  onComplete,
}: TaskCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Use persistent stopwatch timer for the currently active task
  const {
    displaySeconds,
    isPaused,
    hasStarted,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopAndCollectSeconds,
  } = useTaskTimer(isFirstUnfinished ? task.id : null);

  /**
   * Handle user marking the task as done
   */
  const handleMarkDone = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    // Stop timer and collect recorded seconds (or undefined if not started)
    const recordedSeconds = stopAndCollectSeconds();

    // Trigger local micro-celebration animation
    setShowCelebration(true);

    try {
      await onComplete(task.id, recordedSeconds);
    } catch (err) {
      console.error('Error completing task:', err);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setShowCelebration(false), 900);
    }
  };

  // ---------------------------------------------------------------------------
  // STATE 1: LOCKED TASK (Blur with lock icon, STRICTLY NO TEXT)
  // ---------------------------------------------------------------------------
  if (task.isLocked) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-stone-200/60 bg-stone-100/60 p-5 shadow-xs transition-all select-none">
        {/* Blurred frosted background effect */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-stone-200/80 text-stone-600 flex items-center justify-center text-xs font-medium">
              {task.order}
            </span>
            {/* Ambient blurred mock shapes to signify future content without revealing text */}
            <div className="space-y-2 opacity-50 blur-[2px]">
              <div className="h-4 w-40 sm:w-64 bg-stone-300 rounded-sm" />
              <div className="h-3 w-28 sm:w-44 bg-stone-300/80 rounded-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 text-stone-600 bg-stone-200/80 px-3 py-1.5 rounded-full text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Locked</span>
          </div>
        </div>

        {/* Central Lock Overlay */}
        <div className="absolute inset-0 bg-stone-100/40 backdrop-blur-[6px] flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-stone-200 shadow-xs text-stone-600 text-xs font-medium">
            <Lock className="w-3.5 h-3.5 text-stone-600" />
            <span>Unlocks when current step is complete</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 2: COMPLETED TASK (Checked & faded, showing time comparison)
  // ---------------------------------------------------------------------------
  if (task.isCompleted) {
    const hasRecordedTimer =
      task.timeSpentSeconds !== undefined && task.timeSpentSeconds > 0;
    const comparison =
      hasRecordedTimer && task.estimatedMinutes !== undefined
        ? getDurationComparison(task.timeSpentSeconds!, task.estimatedMinutes)
        : null;

    return (
      <motion.div
        initial={{ opacity: 0.8, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-stone-200/80 bg-stone-50/70 p-4 sm:p-5 text-stone-700 transition-all"
      >
        <div className="flex items-start gap-3.5">
          {/* Check icon */}
          <div className="mt-0.5 shrink-0 text-emerald-600 bg-emerald-50 rounded-full p-1 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 fill-emerald-100 stroke-[2.2]" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-stone-600">
                Step {task.order}
              </span>
              {/* Small badge marking extra tasks from bonus time */}
              {task.isBonus && <BonusBadge />}
              {task.linkedTo && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 bg-stone-200/60 px-2 py-0.5 rounded-md">
                  <Tag className="w-3 h-3 text-stone-600" />
                  <span className="truncate max-w-[180px]">
                    {task.linkedTo.title}
                  </span>
                </span>
              )}
            </div>

            <h3 className="text-sm sm:text-base font-semibold text-stone-800 line-through decoration-stone-300">
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
                {task.description}
              </p>
            )}

            {/* Time Metrics section (strictly visible AFTER completion) */}
            <div className="mt-3 pt-2.5 border-t border-stone-200/60 flex flex-wrap items-center gap-2 text-xs">
              {hasRecordedTimer && task.estimatedMinutes !== undefined ? (
                <>
                  <span className="font-medium text-stone-800">
                    You: {secondsToMinutes(task.timeSpentSeconds!)} min
                  </span>
                  <span className="text-stone-600">|</span>
                  <span className="text-stone-700">
                    Suggested: {task.estimatedMinutes} min
                  </span>

                  {comparison && (
                    <span
                      className={`ml-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] border ${
                        comparison.variant === 'faster'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : comparison.variant === 'longer'
                          ? 'bg-orange-50 text-orange-800 border-orange-200'
                          : 'bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {comparison.label}
                    </span>
                  )}
                </>
              ) : task.estimatedMinutes !== undefined ? (
                <span className="text-stone-700">
                  Suggested: {task.estimatedMinutes} min
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ---------------------------------------------------------------------------
  // STATE 3: CURRENT ACTIVE TASK (First Unfinished)
  // Fully visible with stopwatch timer and "Mark done" action
  // ---------------------------------------------------------------------------
  return (
    <motion.div
      layout
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-2xl border-2 border-stone-900 bg-white p-5 sm:p-6 shadow-sm ring-4 ring-stone-900/5 transition-all"
    >
      {/* Micro-celebration burst */}
      {showCelebration && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-20 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-full font-semibold shadow-md">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>Completed! Revealing next focus...</span>
          </div>
        </motion.div>
      )}

      {/* Header tags & Step count */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center text-xs font-bold">
            {task.order}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
            Current Focus
          </span>
          {/* Small badge marking extra tasks from bonus time */}
          {task.isBonus && <BonusBadge />}
        </div>

        {task.linkedTo && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
            <Tag className="w-3 h-3 text-stone-600" />
            <span className="truncate max-w-[200px]">
              {task.linkedTo.title}
            </span>
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight leading-snug">
        {task.title}
      </h2>

      {task.description && (
        <p className="text-sm sm:text-base text-stone-600 mt-1.5 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Reason ("Why this helps") */}
      {task.reason && (
        <div className="mt-3.5 p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs sm:text-sm text-stone-600 flex items-start gap-2">
          <span className="font-semibold text-stone-800 shrink-0">
            Why this helps:
          </span>
          <span>{task.reason}</span>
        </div>
      )}

      {/* Controls: Timer and Complete Button */}
      <div className="mt-5 pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Stopwatch Area */}
        <div className="flex items-center gap-3">
          {/* Running / paused stopwatch display */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-medium transition-colors ${
              hasStarted && !isPaused
                ? 'bg-stone-900 text-white border-stone-900 ring-2 ring-stone-900/20'
                : hasStarted && isPaused
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-stone-50 text-stone-600 border-stone-200'
            }`}
          >
            <TimerIcon
              className={`w-4 h-4 ${
                hasStarted && !isPaused ? 'animate-pulse text-stone-300' : ''
              }`}
            />
            <span className="tabular-nums tracking-wide text-base">
              {formatStopwatch(displaySeconds)}
            </span>
            {hasStarted && isPaused && (
              <span className="text-[10px] font-sans uppercase font-bold text-amber-700 ml-1">
                Paused
              </span>
            )}
          </div>

          {/* Stopwatch Toggle Button: Start -> Pause -> Resume */}
          {!hasStarted ? (
            <button
              type="button"
              onClick={startTimer}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start</span>
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={resumeTimer}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={pauseTimer}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}
        </div>

        {/* Mark Done Button */}
        <button
          type="button"
          onClick={handleMarkDone}
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{isSubmitting ? 'Saving...' : 'Mark done'}</span>
        </button>
      </div>
    </motion.div>
  );
}

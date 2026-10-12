'use client';

import { Fragment } from 'react';
import { motion } from 'motion/react';
import { Check, Lock } from 'lucide-react';
import { StopwatchPlus } from '@/components/icons';
import { DailyTaskItem } from '@/lib/types';

interface DayTrailProps {
  tasks: DailyTaskItem[];
}

type NodeState = 'done' | 'current' | 'locked';

function nodeState(task: DailyTaskItem): NodeState {
  if (task.isCompleted) return 'done';
  return task.isLocked ? 'locked' : 'current';
}

/**
 * Header progress shown as a trail of steps: finished steps light up,
 * the current one pulses, and locked ones stay dim.
 */
export default function DayTrail({ tasks }: DayTrailProps) {
  const ordered = [...tasks].sort((a, b) => a.order - b.order);
  const total = ordered.length;
  const done = ordered.filter((t) => t.isCompleted).length;
  const current = ordered.find((t) => nodeState(t) === 'current');

  const label =
    total > 0 && done === total
      ? `All ${total} steps done`
      : current
        ? `Step ${ordered.indexOf(current) + 1} of ${total}`
        : `${done} of ${total} done`;

  return (
    <div className="space-y-2">
      <div
        role="progressbar"
        aria-label="Today's progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-valuetext={`${done} of ${total} steps done`}
        className="flex items-center"
      >
        {ordered.map((task, i) => {
          const state = nodeState(task);
          return (
            <Fragment key={task.id}>
              {i > 0 && (
                <span
                  aria-hidden="true"
                  className={`h-[3px] flex-1 min-w-2 rounded-full transition-colors duration-500 ${
                    state === 'done' || state === 'current' ? 'bg-good' : 'bg-trail'
                  }`}
                />
              )}
              <span aria-hidden="true" className="relative shrink-0">
                {state === 'current' && (
                  <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />
                )}
                {/* Keyed by state so a change (locked -> current -> done) replays the pop. */}
                <motion.span
                  key={state}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 14 }}
                  className={`relative flex items-center justify-center w-7 h-7 rounded-full border-[3px] text-[11px] font-extrabold ${
                    state === 'done'
                      ? 'bg-good border-good text-surface'
                      : state === 'current'
                        ? 'bg-brand-gradient border-surface text-on-brand shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_35%,transparent)]'
                        : 'bg-surface border-trail text-ink-muted'
                  }`}
                >
                  {state === 'done' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                  ) : state === 'locked' ? (
                    <Lock className="w-3 h-3" />
                  ) : task.isBonus ? (
                    <StopwatchPlus className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </motion.span>
              </span>
            </Fragment>
          );
        })}
      </div>
      <p className="text-sm font-semibold text-ink-muted tabular-nums">{label}</p>
    </div>
  );
}

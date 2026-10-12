'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import { StopwatchPlus, Summit } from '@/components/icons';

interface BonusTimeCardProps {
  minutesLeft: number;
  limitReached: boolean; // True once the daily bonus request limit is used up
  isLoading: boolean;
  onGetBonusTask: () => void;
}

/**
 * Sits under "You're done for today" when there is spare time left.
 * Offers a bonus task, or a closing message once the daily limit is reached.
 */
export default function BonusTimeCard({
  minutesLeft,
  limitReached,
  isLoading,
  onGetBonusTask,
}: BonusTimeCardProps) {
  const Icon = limitReached ? Summit : StopwatchPlus;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 24, delay: 0.25 }}
      className="rounded-3xl border border-line bg-surface p-4 sm:p-5 shadow-soft flex flex-col sm:flex-row sm:items-center gap-3"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="w-10 h-10 shrink-0 rounded-2xl bg-warn-soft text-warn flex items-center justify-center">
          <Icon className="w-5 h-5" />
        </span>
        <p className="text-sm sm:text-base">
          {limitReached ? (
            "That's it for today. Great work."
          ) : (
            <>
              You still have <strong className="tabular-nums">{minutesLeft} min</strong>. Want a bonus task?
            </>
          )}
        </p>
      </div>

      {!limitReached && (
        <button
          type="button"
          onClick={onGetBonusTask}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-ink text-canvas font-extrabold text-sm px-4 py-2.5 rounded-2xl transition-transform hover:-translate-y-0.5 active:scale-[0.97] disabled:opacity-60 disabled:hover:translate-y-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          {isLoading ? 'Picking one for you…' : 'Get bonus task'}
        </button>
      )}
    </motion.section>
  );
}

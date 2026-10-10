'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Clock, Plus } from 'lucide-react';

interface BonusTimeCardProps {
  minutesLeft: number;
  limitReached: boolean; // True once the daily bonus request limit is used up
  isLoading: boolean;
  onGetBonusTask: () => void;
}

/**
 * BonusTimeCard
 * Shown under "You're done for today" when there is spare time left.
 * Offers a bonus task, or a closing message once the daily limit is reached.
 */
export default function BonusTimeCard({
  minutesLeft,
  limitReached,
  isLoading,
  onGetBonusTask,
}: BonusTimeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
          <Clock className="w-4.5 h-4.5" />
        </div>
        <p className="text-sm sm:text-base text-stone-700">
          {limitReached
            ? "That's it for today. Great work."
            : `You still have ${minutesLeft} min. Want a bonus task?`}
        </p>
      </div>

      {/* Button is hidden once the daily bonus limit is reached */}
      {!limitReached && (
        <button
          type="button"
          onClick={onGetBonusTask}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{isLoading ? 'Finding a task...' : 'Get bonus task'}</span>
        </button>
      )}
    </motion.div>
  );
}

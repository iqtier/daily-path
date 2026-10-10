'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Sparkles, RotateCcw, Target, ListTodo } from 'lucide-react';
import Link from 'next/link';

interface CompletionCelebrationProps {
  totalTasks: number;
  onReset: () => void;
}

/**
 * CompletionCelebration
 * Shown on the dashboard when all tasks for the day are finished.
 * Displays a peaceful, motivating message with quick navigation.
 */
export default function CompletionCelebration({
  totalTasks,
  onReset,
}: CompletionCelebrationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 2 }}
      className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-8 text-center shadow-sm space-y-5"
    >
      <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center ring-8 ring-emerald-50">
        <CheckCircle className="w-8 h-8 stroke-[2.2]" />
      </div>

      <div className="space-y-1.5 max-w-md mx-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center justify-center gap-2">
          <span>You&apos;re done for today</span>
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-300" />
        </h2>
        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          All {totalTasks} focus steps have been completed. Step back, rest your mind, and let your progress compound.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-colors"
        >
          <Target className="w-4 h-4" />
          <span>Review Goals</span>
        </Link>

        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-4 py-2 rounded-xl transition-colors"
        >
          <ListTodo className="w-4 h-4" />
          <span>Plan Future Tasks</span>
        </Link>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl border border-stone-200/80 hover:bg-stone-50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sample Path</span>
        </button>
      </div>
    </motion.div>
  );
}

'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Signpost, Summit } from '@/components/icons';
import Link from 'next/link';
import { celebrateDay } from '@/lib/celebrate';

interface CompletionCelebrationProps {
  totalTasks: number;
  /** True only right after the last task is finished, so a page reload does not replay confetti. */
  celebrate?: boolean;
}

/** Shown on the dashboard when every task for the day is finished. */
export default function CompletionCelebration({
  totalTasks,
  celebrate = false,
}: CompletionCelebrationProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (celebrate && ref.current) void celebrateDay(ref.current);
  }, [celebrate]);

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="relative overflow-hidden rounded-[2rem] bg-surface p-6 sm:p-8 text-center shadow-[0_24px_50px_-24px_color-mix(in_oklab,var(--brand)_55%,transparent)]"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(90%_70%_at_50%_0%,color-mix(in_oklab,var(--brand)_14%,transparent),transparent_70%)]"
      />

      <div className="relative space-y-5">
        <motion.div
          initial={{ rotate: -12, scale: 0.6 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 12, delay: 0.15 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-brand-gradient text-on-brand flex items-center justify-center shadow-[0_10px_24px_-8px_color-mix(in_oklab,var(--brand-2)_60%,transparent)]"
        >
          <Summit className="w-8 h-8 stroke-[2.2]" />
        </motion.div>

        <div className="space-y-1.5 max-w-md mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
            You&apos;re done for today
          </h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
            All {totalTasks} steps checked off. Go rest, your progress is stacking up.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/goals"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-ink bg-sunk hover:bg-line px-4 py-2.5 rounded-2xl transition-colors"
          >
            <Summit className="w-4 h-4" />
            Review goals
          </Link>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-ink bg-sunk hover:bg-line px-4 py-2.5 rounded-2xl transition-colors"
          >
            <Signpost className="w-4 h-4" />
            Plan what&apos;s next
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

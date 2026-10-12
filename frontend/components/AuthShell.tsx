'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TrailMark } from '@/components/icons';
import ThemeToggle from '@/components/ThemeToggle';

/** Shared frame for the sign-in and sign-up pages. */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-canvas text-ink flex flex-col justify-center px-4 py-12 overflow-hidden">
      {/* Soft color wash behind the card; decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_10%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent_70%),radial-gradient(50%_35%_at_85%_90%,color-mix(in_oklab,var(--brand-2)_16%,transparent),transparent_70%)]"
      />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ rotate: -12, scale: 0.7, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 14 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-gradient text-on-brand shadow-[0_12px_24px_-10px_color-mix(in_oklab,var(--brand)_80%,transparent)] mb-4"
          >
            <TrailMark className="w-7 h-7 stroke-[2.2]" />
          </motion.div>
          <h1 className="text-3xl font-extrabold tracking-tight text-balance">{title}</h1>
          <p className="mt-1.5 text-sm sm:text-base text-ink-muted">{subtitle}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 24, delay: 0.05 }}
          className="mt-8 bg-surface rounded-[2rem] shadow-soft px-5 py-7 sm:px-8 space-y-6"
        >
          {children}
          <div className="pt-5 border-t border-line text-center text-sm text-ink-muted">{footer}</div>
        </motion.div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import type { IconComponent } from '@/components/icons';

/** Shared form control styling so every field matches across pages and modals. */
export const inputClass =
  'w-full px-3.5 py-2.5 rounded-2xl border border-line bg-canvas text-ink text-sm placeholder:text-ink-muted/70 transition-colors focus:border-brand';

export const labelClass = 'block text-xs font-bold text-ink-muted uppercase tracking-wider mb-1.5';

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-extrabold text-on-brand bg-brand-gradient shadow-[0_8px_18px_-8px_color-mix(in_oklab,var(--brand)_80%,transparent)] transition-transform hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0';

export const quietButtonClass =
  'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-sm font-bold text-ink-muted hover:text-ink hover:bg-sunk transition-colors';

export const iconButtonClass =
  'p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-sunk transition-colors';

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: IconComponent;
  title: string;
  subtitle: string;
}) {
  return (
    <header className="flex items-start gap-3">
      <span className="mt-1 w-11 h-11 shrink-0 rounded-2xl bg-brand-gradient text-on-brand flex items-center justify-center shadow-soft">
        <Icon className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm sm:text-base text-ink-muted mt-0.5">{subtitle}</p>
      </div>
    </header>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={selected}
            className={`shrink-0 px-3.5 py-2 rounded-full text-xs sm:text-sm font-bold transition-all ${
              selected ? 'bg-ink text-canvas shadow-soft' : 'bg-sunk text-ink-muted hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function LoadingState({ message }: { message: string }) {
  return (
    <div className="py-16 text-center space-y-3" aria-live="polite">
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
        className="w-10 h-10 mx-auto rounded-full border-4 border-trail border-t-brand"
      />
      <p className="text-sm font-semibold text-ink-muted">{message}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: IconComponent;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border-2 border-dashed border-line bg-surface/60 px-6 py-10 text-center space-y-3"
    >
      <span className="w-14 h-14 mx-auto rounded-2xl bg-sunk text-ink-muted flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </span>
      <p className="text-base font-extrabold">{title}</p>
      {body && <p className="text-sm text-ink-muted max-w-sm mx-auto">{body}</p>}
      {action && <div className="pt-1">{action}</div>}
    </motion.div>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-3 text-sm font-semibold text-danger">
      {message}
    </div>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog shell: bottom sheet on phones, centered card on larger screens.
 * Handles Escape, a focus trap, and returning focus to the trigger on close.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: IconComponent;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Kept in a ref so the effect does not re-run (and steal focus) when the parent re-renders.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const first = panelRef.current?.querySelector<HTMLElement>('input, textarea, select');
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#0b0a1a]/55 backdrop-blur-sm"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-surface shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)] pb-[env(safe-area-inset-bottom,0px)]"
          >
            <div className="sticky top-0 z-10 bg-surface flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-brand-gradient text-on-brand flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </span>
                <h2 id={titleId} className="text-lg font-extrabold">
                  {title}
                </h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className={iconButtonClass}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

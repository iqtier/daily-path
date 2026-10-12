'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { Plus, User as UserIcon } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { type IconComponent, Signpost, SteppingStones, Summit, TrailMark } from '@/components/icons';

interface NavbarProps {
  onOpenNewGoal?: () => void;
  onOpenNewTask?: () => void;
  onResetDemo?: () => void;
}

/** One half of the add control: the thing's own icon with a small plus badge, then its name. */
function AddButton({
  icon: Icon,
  label,
  ariaLabel,
  onClick,
}: {
  icon: IconComponent;
  label: string;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="group inline-flex items-center gap-1.5 h-full pl-2 pr-2.5 rounded-[0.6rem] text-xs sm:text-sm font-bold text-ink-muted hover:text-ink hover:bg-surface hover:shadow-soft transition-all"
    >
      <span className="relative w-4 h-4 shrink-0">
        <Icon className="w-4 h-4" />
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-brand-gradient text-on-brand flex items-center justify-center ring-2 ring-sunk transition-transform group-hover:scale-110 group-hover:ring-surface">
          <Plus className="w-2 h-2 stroke-[4]" />
        </span>
      </span>
      {label}
    </button>
  );
}

const LINKS = [
  { href: '/dashboard', label: 'Today', mobileLabel: 'Today', icon: SteppingStones },
  { href: '/goals', label: 'Goals', mobileLabel: 'Goals', icon: Summit },
  { href: '/tasks', label: 'Future Tasks', mobileLabel: 'Future', icon: Signpost },
] as const;

/**
 * Floating top bar on all sizes, plus a floating dock on phones.
 * Every color comes from theme tokens, so both follow light and dark mode.
 */
export default function Navbar({ onOpenNewGoal, onOpenNewTask }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/'
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header className="sticky top-0 z-30 px-3 sm:px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
        <div className="max-w-4xl mx-auto h-14 pl-2 pr-2 sm:pl-2.5 flex items-center justify-between gap-2 rounded-[1.4rem] bg-surface/80 backdrop-blur-xl border border-line/70 shadow-soft">
          <Link href="/dashboard" aria-label="Daily Path, today" className="flex items-center gap-2.5 group rounded-2xl">
            <span className="w-10 h-10 rounded-[0.9rem] bg-brand-gradient text-on-brand flex items-center justify-center shadow-[0_6px_14px_-6px_color-mix(in_oklab,var(--brand)_80%,transparent)] transition-transform group-hover:-rotate-6 group-hover:scale-105">
              <TrailMark className="w-5 h-5 stroke-[2.4]" />
            </span>
            {/* Hidden on the narrowest phones so the action buttons fit at 375px. */}
            <span className="hidden min-[400px]:inline font-extrabold tracking-tight text-base sm:text-lg">
              Daily Path
            </span>
          </Link>

          <nav aria-label="Main" className="hidden md:flex items-center gap-1 text-sm">
            {LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl font-bold transition-colors ${
                    active ? 'text-on-brand' : 'text-ink-muted hover:text-ink hover:bg-sunk'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 rounded-2xl bg-brand-gradient shadow-[0_6px_14px_-6px_color-mix(in_oklab,var(--brand)_80%,transparent)]"
                    />
                  )}
                  <Icon className="relative w-4 h-4" />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1.5">
            {(onOpenNewGoal || onOpenNewTask) && (
              <div role="group" aria-label="Add new" className="flex items-center h-9 p-0.5 rounded-xl bg-sunk">
                {onOpenNewGoal && (
                  <AddButton icon={Summit} label="Goal" ariaLabel="New goal" onClick={onOpenNewGoal} />
                )}
                {onOpenNewGoal && onOpenNewTask && (
                  <span aria-hidden="true" className="w-px h-4 bg-line" />
                )}
                {onOpenNewTask && (
                  <AddButton icon={Signpost} label="Task" ariaLabel="New future task" onClick={onOpenNewTask} />
                )}
              </div>
            )}

            <span aria-hidden="true" className="hidden sm:block w-px h-6 bg-line mx-0.5" />

            <ThemeToggle />

            <Link
              href="/login"
              title="Account"
              aria-label="Account"
              className="w-9 h-9 rounded-full bg-sunk flex items-center justify-center text-ink-muted hover:text-ink transition-colors"
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label="Main"
        className="md:hidden fixed inset-x-3 z-30 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] rounded-[1.6rem] bg-surface/85 backdrop-blur-xl border border-line/70 shadow-soft p-1.5 flex items-center"
      >
        {LINKS.map(({ href, mobileLabel, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[1.2rem] text-[11px] font-extrabold transition-colors ${
                active ? 'text-on-brand' : 'text-ink-muted'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="dock-active"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="absolute inset-0 rounded-[1.2rem] bg-brand-gradient"
                />
              )}
              <Icon className="relative w-5 h-5" />
              <span className="relative">{mobileLabel}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  CheckCircle2,
  Target,
  ListTodo,
  Plus,
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';

interface NavbarProps {
  onOpenNewGoal?: () => void;
  onOpenNewTask?: () => void;
  onResetDemo?: () => void;
}

/**
 * Navbar
 * Calm, minimalist header and mobile bottom bar for Daily Path.
 * Provides quick access to Today's path, Goals, Future Tasks, and creation actions.
 */
export default function Navbar({
  onOpenNewGoal,
  onOpenNewTask,
  onResetDemo,
}: NavbarProps) {
  const pathname = usePathname();

  const isToday = pathname === '/dashboard' || pathname === '/';
  const isGoals = pathname === '/goals';
  const isTasks = pathname === '/tasks';

  return (
    <>
      {/* Desktop & Tablet Top Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-stone-200/80 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-stone-50 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              <Compass className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-semibold text-stone-900 tracking-tight text-base sm:text-lg">
                Daily Path
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-stone-600">
                one focus at a time
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-100/80 p-1 rounded-full border border-stone-200/60 text-sm">
            <Link
              href="/dashboard"
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                isToday
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Today
            </Link>
            <Link
              href="/goals"
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                isGoals
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Goals
            </Link>
            <Link
              href="/tasks"
              className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
                isTasks
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Future Tasks
            </Link>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* TODO: remove before connecting the real backend */}
            {onResetDemo && (
              <button
                type="button"
                onClick={onResetDemo}
                title="Reset demo data to initial sample"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs text-stone-700 hover:text-stone-900 px-2.5 py-1.5 rounded-lg border border-stone-200/80 hover:bg-stone-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            )}

            {onOpenNewGoal && (
              <button
                type="button"
                onClick={onOpenNewGoal}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Goal</span>
              </button>
            )}

            {onOpenNewTask && (
              <button
                type="button"
                onClick={onOpenNewTask}
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Task</span>
              </button>
            )}

            <Link
              href="/login"
              title="User profile"
              className="ml-1 w-8 h-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600 hover:text-stone-900 transition-colors"
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-2 flex items-center justify-around shadow-sm">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            isToday ? 'text-stone-900 font-semibold' : 'text-stone-600'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isToday ? 'bg-stone-900 text-white' : 'text-stone-600'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span>Today</span>
        </Link>

        <Link
          href="/goals"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            isGoals ? 'text-stone-900 font-semibold' : 'text-stone-600'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isGoals ? 'bg-stone-900 text-white' : 'text-stone-600'
            }`}
          >
            <Target className="w-4 h-4" />
          </div>
          <span>Goals</span>
        </Link>

        <Link
          href="/tasks"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium transition-colors ${
            isTasks ? 'text-stone-900 font-semibold' : 'text-stone-600'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isTasks ? 'bg-stone-900 text-white' : 'text-stone-600'
            }`}
          >
            <ListTodo className="w-4 h-4" />
          </div>
          <span>Future</span>
        </Link>
      </nav>
    </>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import NewGoalModal from '@/components/NewGoalModal';
import NewTaskModal from '@/components/NewTaskModal';
import { EmptyState, FilterPills, LoadingState, PageHeader, iconButtonClass, primaryButtonClass } from '@/components/ui';
import { getGoals, addGoal, updateGoal, deleteGoal, addFutureTask } from '@/lib/api';
import {
  Goal,
  GoalCategory,
  GoalStatus,
  FutureTaskType,
  TaskSize,
  EstimateSource,
} from '@/lib/types';
import { ACCENT_CLASS, CATEGORY_META } from '@/lib/category-theme';
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ChevronRight,
} from 'lucide-react';
import { Cairn, Summit } from '@/components/icons';

type StatusFilter = 'all' | GoalStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'achieved', label: 'Achieved' },
];

const NEXT_STATUS: Record<GoalStatus, GoalStatus> = {
  active: 'paused',
  paused: 'achieved',
  achieved: 'active',
};

const EMPTY_COPY: Record<StatusFilter, { title: string; body: string }> = {
  all: {
    title: 'No goals yet',
    body: "What's one thing you'd love to get better at? Add it and your daily steps will start pointing there.",
  },
  active: { title: 'Nothing active right now', body: 'Pick a goal to work on and set it to active.' },
  paused: { title: 'No paused goals', body: 'Everything you set out to do is still in motion.' },
  achieved: { title: 'No trophies yet', body: 'Goals you finish will land here. Keep going!' },
};

/** Long-term goals. Each card opens the goal's history and reflections. */
export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // State is only set inside promise callbacks, after the request settles, so this is safe to
  // start from an effect and to reuse for quiet refreshes after adding, editing, or deleting a goal.
  const loadGoals = useCallback(
    () =>
      getGoals()
        .then((data) => {
          setGoals(data);
          setLoadFailed(false);
        })
        .catch((err) => {
          console.error('Failed to load goals:', err);
          setLoadFailed(true);
        })
        .finally(() => setIsLoading(false)),
    []
  );

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setLoadFailed(false);
    void loadGoals();
  };

  const openNewGoal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (goalData: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, goalData);
    } else {
      await addGoal(goalData);
    }
    setEditingGoal(null);
    await loadGoals();
  };

  const handleDeleteGoal = async (goal: Goal) => {
    if (confirm(`Delete "${goal.title}"? Its history and reflections go with it.`)) {
      await deleteGoal(goal.id);
      await loadGoals();
    }
  };

  const handleToggleStatus = async (goal: Goal) => {
    await updateGoal(goal.id, { status: NEXT_STATUS[goal.status] });
    await loadGoals();
  };

  const handleSaveTask = async (taskData: {
    title: string;
    type: FutureTaskType;
    dueDate: string;
    weight?: number;
    estimatedHours?: number;
    size?: TaskSize;
    estimateSource?: EstimateSource;
    materials?: string;
  }) => {
    await addFutureTask(taskData);
  };

  const filteredGoals = goals.filter((g) => filterStatus === 'all' || g.status === filterStatus);

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28 md:pb-12">
      <Navbar onOpenNewGoal={openNewGoal} onOpenNewTask={() => setIsTaskModalOpen(true)} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <PageHeader
          icon={Summit}
          title="Goals"
          subtitle="The big things you're working toward. Every daily step points at one."
        />

        <FilterPills label="Filter goals by status" options={FILTERS} value={filterStatus} onChange={setFilterStatus} />

        {isLoading && <LoadingState message="Gathering your goals…" />}

        {!isLoading && loadFailed && (
          <EmptyState
            icon={Summit}
            title="Your goals didn't load"
            body="Check your connection, then try again."
            action={
              <button type="button" onClick={handleRetryLoad} className={primaryButtonClass}>
                Try again
              </button>
            }
          />
        )}

        {!isLoading && !loadFailed && filteredGoals.length === 0 && (
          <EmptyState
            icon={Summit}
            title={EMPTY_COPY[filterStatus].title}
            body={EMPTY_COPY[filterStatus].body}
            action={
              filterStatus === 'all' || filterStatus === 'active' ? (
                <button type="button" onClick={openNewGoal} className={primaryButtonClass}>
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Add a goal
                </button>
              ) : undefined
            }
          />
        )}

        <ul className="space-y-3">
          {filteredGoals.map((goal, i) => {
            const meta = CATEGORY_META[goal.category] ?? CATEGORY_META.other;
            const CategoryIcon = meta.icon;
            const isAchieved = goal.status === 'achieved';

            return (
              <motion.li
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), type: 'spring', stiffness: 260, damping: 26 }}
                className={`${ACCENT_CLASS[goal.category] ?? ACCENT_CLASS.other} group relative rounded-3xl bg-surface p-4 sm:p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow`}
              >
                <div className="flex items-start gap-3.5">
                  <span className="shrink-0 w-11 h-11 rounded-2xl bg-accent/15 text-accent-ink flex items-center justify-center">
                    <CategoryIcon className="w-5 h-5" />
                  </span>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-ink">
                        {meta.label}
                      </span>

                      {/* Above the card link so it stays clickable on its own. */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(goal)}
                        title="Change status"
                        aria-label={`Status: ${goal.status}. Change to ${NEXT_STATUS[goal.status]}`}
                        className={`relative z-10 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                          goal.status === 'active'
                            ? 'bg-good-soft text-good'
                            : goal.status === 'paused'
                              ? 'bg-warn-soft text-warn'
                              : 'bg-brand/15 text-ink'
                        }`}
                      >
                        {goal.status === 'active' && <PlayCircle className="w-3 h-3" />}
                        {goal.status === 'paused' && <PauseCircle className="w-3 h-3" />}
                        {isAchieved && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{goal.status}</span>
                      </button>
                    </div>

                    <h2 className="text-base sm:text-lg font-extrabold leading-snug">
                      {/* The ::after overlay makes the whole card a single link target. */}
                      <Link
                        href={`/goals/${goal.id}`}
                        className="after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-[color:var(--focus)]"
                      >
                        {goal.title}
                      </Link>
                    </h2>

                    {goal.details && (
                      <p className="text-sm text-ink-muted leading-relaxed line-clamp-2">{goal.details}</p>
                    )}
                  </div>

                  <div className="relative z-10 flex items-center shrink-0 -mr-1 -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className={iconButtonClass}
                      aria-label={`Edit ${goal.title}`}
                      title="Edit goal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(goal)}
                      className="p-2 rounded-xl text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                      aria-label={`Delete ${goal.title}`}
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-line flex items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <Cairn className={`w-4 h-4 ${goal.completedTodoCount > 0 ? 'text-accent' : 'text-ink-muted'}`} />
                    <span className="tabular-nums">{goal.completedTodoCount}</span>
                    <span className="text-ink-muted font-semibold">
                      {goal.completedTodoCount === 1 ? 'step done' : 'steps done'}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-bold text-ink-muted group-hover:text-accent-ink transition-colors">
                    History &amp; reflections
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </main>

      <NewGoalModal
        isOpen={isModalOpen}
        initialData={editingGoal}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <NewTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} onSave={handleSaveTask} />
    </div>
  );
}

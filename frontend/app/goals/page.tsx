'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import NewGoalModal from '@/components/NewGoalModal';
import NewTaskModal from '@/components/NewTaskModal';
import {
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  addFutureTask,

} from '@/lib/api';
import {
  Goal,
  GoalCategory,
  GoalStatus,
  FutureTaskType,
  TaskSize,
  EstimateSource,
} from '@/lib/types';
import {
  Target,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ChevronRight,
  CheckCheck,
} from 'lucide-react';

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  learning: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  fitness: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  career: 'bg-sky-50 text-sky-700 border-sky-200',
  health: 'bg-teal-50 text-teal-700 border-teal-200',
  personal: 'bg-amber-50 text-amber-700 border-amber-200',
  other: 'bg-stone-100 text-stone-700 border-stone-200',
};

/**
 * GoalsPage
 * Manages high-level long term goals (fitness, career, learning, health, personal, other).
 * Goals and future tasks are separate.
 * Each goal card shows completed daily to-do count and opens the Goal Detail page on click.
 */
export default function GoalsPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Load goals from API
  const loadGoals = useCallback(async () => {
    try {
      const goalsData = await getGoals();
      setGoals(goalsData);
    } catch (err) {
      console.error('Failed to load goals data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getGoals()
      .then((goalsData) => {
        if (active) {
          setGoals(goalsData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load goals:', err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Handle Create or Edit Goal
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

  // Handle Delete Goal
  const handleDeleteGoal = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(id);
      await loadGoals();
    }
  };

  // Quick toggle status
  const handleToggleStatus = async (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation();
    const nextStatus: GoalStatus =
      goal.status === 'active'
        ? 'paused'
        : goal.status === 'paused'
        ? 'achieved'
        : 'active';
    await updateGoal(goal.id, { status: nextStatus });
    await loadGoals();
  };

  const handleReset = async () => {
  
    await loadGoals();
  };

  // Quick task modal callback
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

  // Filtered goals
  const filteredGoals = goals.filter((g) => {
    if (filterStatus === 'all') return true;
    return g.status === filterStatus;
  });

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 pb-24 md:pb-12">
      <Navbar
        onOpenNewGoal={() => {
          setEditingGoal(null);
          setIsModalOpen(true);
        }}
        onOpenNewTask={() => setIsTaskModalOpen(true)}
        onResetDemo={handleReset}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-stone-900 text-white">
                <Target className="w-4 h-4" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Goals
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Your ongoing compass directions. Track completed daily to-dos over time.
            </p>
          </div>

    
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['all', 'active', 'paused', 'achieved'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-full capitalize font-medium transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center text-stone-600 text-sm">
            Loading your goals...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredGoals.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600 space-y-3 bg-white">
            <Target className="w-8 h-8 mx-auto text-stone-400 stroke-1" />
            <p className="text-sm">No goals in this view.</p>
            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create your first goal</span>
            </button>
          </div>
        )}

        {/* Goals List - Clickable cards opening /goals/[id] */}
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const categoryClass =
              CATEGORY_COLORS[goal.category] ||
              'bg-stone-100 text-stone-700 border-stone-200';

            return (
              <div
                key={goal.id}
                onClick={() => router.push(`/goals/${goal.id}`)}
                className="group rounded-2xl border border-stone-200/90 bg-white p-4 sm:p-5 shadow-xs hover:border-stone-400 hover:shadow-sm transition-all cursor-pointer space-y-3"
              >
                {/* Top Section: Badges & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${categoryClass}`}
                      >
                        {goal.category}
                      </span>

                      {/* Status indicator button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(e, goal)}
                        title="Click to cycle status"
                        className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                          goal.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : goal.status === 'paused'
                            ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'bg-stone-100 text-stone-600 line-through'
                        }`}
                      >
                        {goal.status === 'active' && (
                          <PlayCircle className="w-3 h-3 text-emerald-600" />
                        )}
                        {goal.status === 'paused' && (
                          <PauseCircle className="w-3 h-3 text-amber-600" />
                        )}
                        {goal.status === 'achieved' && (
                          <CheckCircle2 className="w-3 h-3 text-stone-500" />
                        )}
                        <span className="capitalize">{goal.status}</span>
                      </button>
                    </div>

                    <h3 className="text-base font-semibold text-stone-900 group-hover:text-stone-950 leading-snug">
                      {goal.title}
                    </h3>

                    {goal.details && (
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed line-clamp-2">
                        {goal.details}
                      </p>
                    )}
                  </div>

                  {/* Actions: Edit & Delete (Clicks stopped from bubbling) */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Edit Goal"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteGoal(e, goal.id)}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Completed To-dos Count Display */}
                <div className="pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-1.5 font-medium text-stone-800">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{goal.completedTodoCount} to-dos completed</span>
                  </div>

                  <span className="text-[11px] text-stone-400 group-hover:text-stone-700 flex items-center gap-0.5 transition-colors font-medium">
                    <span>History & reflections</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Goal Modal */}
      <NewGoalModal
        isOpen={isModalOpen}
        initialData={editingGoal}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      {/* Task Modal */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
}

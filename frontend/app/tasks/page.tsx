'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import NewTaskModal from '@/components/NewTaskModal';
import NewGoalModal from '@/components/NewGoalModal';
import {
  getFutureTasks,
  addFutureTask,
  updateFutureTask,
  deleteFutureTask,
  addGoal,
  resetDemoData,
} from '@/lib/api';
import {
  FutureTask,
  FutureTaskType,
  GoalCategory,
  GoalStatus,
  TaskSize,
  EstimateSource,
} from '@/lib/types';
import { formatDueDateBadge } from '@/lib/formatters';
import {
  ListTodo,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Percent,
  Clock,
  BookOpen,
  CheckCircle2,
  Circle,
  Check,
} from 'lucide-react';

const TYPE_COLORS: Record<FutureTaskType, string> = {
  assignment: 'bg-sky-50 text-sky-700 border-sky-200',
  exam: 'bg-rose-50 text-rose-700 border-rose-200',
  project: 'bg-purple-50 text-purple-700 border-purple-200',
  other: 'bg-stone-100 text-stone-700 border-stone-200',
};

/**
 * TasksPage
 * Manages upcoming major deliverables, exams, assignments, and projects.
 * Sorted automatically by due date.
 * Each future task card displays progress (hoursDone / estimatedHours).
 */
export default function TasksPage() {
  const [tasks, setTasks] = useState<FutureTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FutureTask | null>(null);

  // Load future tasks sorted by due date
  const loadData = useCallback(async () => {
    try {
      const tasksData = await getFutureTasks();
      setTasks(tasksData);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    getFutureTasks()
      .then((tasksData) => {
        if (active) {
          setTasks(tasksData);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load tasks:', err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Save (add or edit) future task
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
    if (editingTask) {
      await updateFutureTask(editingTask.id, taskData);
    } else {
      await addFutureTask(taskData);
    }
    setEditingTask(null);
    await loadData();
  };

  // Delete future task
  const handleDeleteTask = async (id: string) => {
    if (confirm('Are you sure you want to delete this future task?')) {
      await deleteFutureTask(id);
      await loadData();
    }
  };

  // Toggle completed status
  const handleToggleTaskStatus = async (task: FutureTask) => {
    const isNowDone = task.status !== 'done';
    const nextStatus = isNowDone ? 'done' : 'pending';
    await updateFutureTask(task.id, {
      status: nextStatus,
      completedAt: isNowDone ? new Date().toISOString() : undefined,
    });
    await loadData();
  };

  const handleReset = async () => {
    await resetDemoData();
    await loadData();
  };

  const handleSaveGoal = async (goalData: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => {
    await addGoal(goalData);
  };

  // Filter and sort tasks:
  // 1. Pending tasks first (by due date ascending)
  // 2. Done tasks at the bottom (most recently completed first)
  const filteredTasks = tasks
    .filter((t) => {
      if (filterType === 'all') return true;
      return t.type === filterType;
    })
    .sort((a, b) => {
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;

      if (!aDone && !bDone) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      const aTime = a.completedAt
        ? new Date(a.completedAt).getTime()
        : new Date(a.dueDate || a.createdAt).getTime();
      const bTime = b.completedAt
        ? new Date(b.completedAt).getTime()
        : new Date(b.dueDate || b.createdAt).getTime();
      return bTime - aTime;
    });

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 pb-24 md:pb-12">
      <Navbar
        onOpenNewGoal={() => setIsGoalModalOpen(true)}
        onOpenNewTask={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onResetDemo={handleReset}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-stone-900 text-white">
                <ListTodo className="w-4 h-4" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                Future Tasks
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Upcoming deadlines, projects, and exams — automatically sorted by due date.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white bg-stone-900 hover:bg-stone-800 px-4 py-2 rounded-xl transition-all shadow-xs self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>

        {/* Filter Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {['all', 'assignment', 'exam', 'project', 'other'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full capitalize font-medium transition-colors cursor-pointer ${
                filterType === type
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="py-12 text-center text-stone-600 text-sm">
            Loading future tasks...
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-600 space-y-3 bg-white">
            <ListTodo className="w-8 h-8 mx-auto text-stone-400 stroke-1" />
            <p className="text-sm">No tasks in this category.</p>
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-stone-900 hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add an upcoming task</span>
            </button>
          </div>
        )}

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const typeBadgeClass =
              TYPE_COLORS[task.type] ||
              'bg-stone-100 text-stone-700 border-stone-200';
            const dueBadge = formatDueDateBadge(task.dueDate);
            const isDone = task.status === 'done';

            // Calculate progress metrics: hoursDone / estimatedHours
            const hasEstimate =
              task.estimatedHours !== undefined && task.estimatedHours > 0;
            const progressRatio =
              hasEstimate && task.estimatedHours
                ? isDone
                  ? 100
                  : Math.min(
                      100,
                      Math.round((task.hoursDone / task.estimatedHours) * 100)
                    )
                : 0;

            return (
              <div
                key={task.id}
                className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all space-y-3 ${
                  isDone
                    ? 'border-stone-200/60 opacity-75'
                    : 'border-stone-200/90 hover:border-stone-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Top Row: Type, Due Date, Weight, and Size */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${typeBadgeClass}`}
                      >
                        {task.type}
                      </span>

                      {/* Due date badge OR Completed badge: if done, show green Completed badge; do not show overdue or due badges */}
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            dueBadge.isUrgent
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{dueBadge.text}</span>
                        </span>
                      )}

                      {/* Weight if present */}
                      {task.weight !== undefined && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-600 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded-md">
                          <Percent className="w-3 h-3" />
                          <span>{task.weight}% weight</span>
                        </span>
                      )}

                      {/* Estimated effort hours */}
                      {task.estimatedHours !== undefined && (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-stone-600 bg-stone-50 border border-stone-200/80 px-2 py-0.5 rounded-md">
                          <Clock className="w-3 h-3" />
                          <span>~{task.estimatedHours}h est.</span>
                        </span>
                      )}

                      {/* Task Size badge if chosen */}
                      {task.size && (
                        <span className="inline-flex items-center text-[11px] font-medium capitalize text-stone-700 bg-stone-100 border border-stone-200/80 px-2 py-0.5 rounded-md">
                          {task.size}
                        </span>
                      )}
                    </div>

                    {/* Task Title with Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskStatus(task)}
                        title={isDone ? 'Mark as pending' : 'Mark as done'}
                        className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                      <h3
                        className={`text-base font-semibold text-stone-900 leading-snug ${
                          isDone ? 'line-through text-stone-500' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                    </div>

                    {/* Materials & Instructions */}
                    {task.materials && (
                      <div className="flex items-start gap-1.5 text-xs text-stone-600 bg-stone-50/80 p-2.5 rounded-xl border border-stone-100">
                        <BookOpen className="w-3.5 h-3.5 text-stone-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{task.materials}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
                      title="Edit Future Task"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Delete Future Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar on Future Task Card */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-stone-700">
                      {hasEstimate ? (
                        <>
                          <span className="font-semibold text-stone-900">
                            {isDone
                              ? `${task.estimatedHours}h of ~${task.estimatedHours}h done (100%)`
                              : `${task.hoursDone}h of ~${task.estimatedHours}h done (${progressRatio}%)`}
                          </span>
                          {isDone && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-sm border border-emerald-200">
                              <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                              <span>Done</span>
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="font-semibold text-stone-900">
                          {task.hoursDone}h done
                        </span>
                      )}
                    </div>

                    {hasEstimate && (
                      <span className="text-[11px] text-stone-500 font-mono">
                        {progressRatio}%
                      </span>
                    )}
                  </div>

                  {/* Visual Progress Bar (only rendered when estimatedHours is present) */}
                  {hasEstimate && (
                    <div
                      className="w-full bg-stone-100 h-2 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progressRatio}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress on ${task.title}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          isDone
                            ? 'bg-emerald-600'
                            : task.hoursDone > 0
                            ? 'bg-stone-900'
                            : 'bg-transparent'
                        }`}
                        style={{ width: `${progressRatio}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Task Modal */}
      <NewTaskModal
        isOpen={isTaskModalOpen}
        initialData={editingTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      {/* Goal Modal */}
      <NewGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />
    </div>
  );
}

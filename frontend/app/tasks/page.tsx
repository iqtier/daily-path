'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import Navbar from '@/components/Navbar';
import NewTaskModal from '@/components/NewTaskModal';
import NewGoalModal from '@/components/NewGoalModal';
import { EmptyState, FilterPills, LoadingState, PageHeader, iconButtonClass, primaryButtonClass } from '@/components/ui';
import { getFutureTasks, addFutureTask, updateFutureTask, deleteFutureTask, addGoal } from '@/lib/api';
import {
  FutureTask,
  FutureTaskType,
  GoalCategory,
  GoalStatus,
  TaskSize,
  EstimateSource,
} from '@/lib/types';
import { formatDueDateBadge } from '@/lib/formatters';
import { burstPointFrom, celebrateTask } from '@/lib/celebrate';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Percent,
  Clock,
  BookOpen,
  Check,
  ClipboardList,
  FileText,
  FolderKanban,
} from 'lucide-react';
import { type IconComponent, Pebbles, Signpost } from '@/components/icons';

type TypeFilter = 'all' | FutureTaskType;

const FILTERS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'assignment', label: 'Assignments' },
  { value: 'exam', label: 'Exams' },
  { value: 'project', label: 'Projects' },
  { value: 'other', label: 'Other' },
];

const TYPE_META: Record<FutureTaskType, { label: string; icon: IconComponent }> = {
  assignment: { label: 'Assignment', icon: FileText },
  exam: { label: 'Exam', icon: ClipboardList },
  project: { label: 'Project', icon: FolderKanban },
  other: { label: 'Other', icon: Pebbles },
};

/** Upcoming deadlines, sorted by due date, each with progress from linked daily steps. */
export default function TasksPage() {
  const [tasks, setTasks] = useState<FutureTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filterType, setFilterType] = useState<TypeFilter>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<FutureTask | null>(null);

  // State is only set inside promise callbacks, after the request settles, so this is safe to
  // start from an effect and to reuse for quiet refreshes after adding, editing, or completing a task.
  const loadData = useCallback(
    () =>
      getFutureTasks()
        .then((data) => {
          setTasks(data);
          setLoadFailed(false);
        })
        .catch((err) => {
          console.error('Failed to load tasks:', err);
          setLoadFailed(true);
        })
        .finally(() => setIsLoading(false)),
    []
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRetryLoad = () => {
    setIsLoading(true);
    setLoadFailed(false);
    void loadData();
  };

  const openNewTask = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
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
    if (editingTask) {
      await updateFutureTask(editingTask.id, taskData);
    } else {
      await addFutureTask(taskData);
    }
    setEditingTask(null);
    await loadData();
  };

  const handleDeleteTask = async (task: FutureTask) => {
    if (confirm(`Delete "${task.title}"?`)) {
      await deleteFutureTask(task.id);
      await loadData();
    }
  };

  const handleToggleTaskStatus = async (task: FutureTask, button: HTMLElement) => {
    const isNowDone = task.status !== 'done';
    // Read before the reload re-renders the list.
    const burst = isNowDone ? burstPointFrom(button) : null;
    try {
      await updateFutureTask(task.id, {
        status: isNowDone ? 'done' : 'pending',
        completedAt: isNowDone ? new Date().toISOString() : undefined,
      });
      if (burst) void celebrateTask(burst);
      await loadData();
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleSaveGoal = async (goalData: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => {
    await addGoal(goalData);
  };

  // Pending first by due date; done at the bottom, most recently completed first.
  const filteredTasks = tasks
    .filter((t) => filterType === 'all' || t.type === filterType)
    .sort((a, b) => {
      const aDone = a.status === 'done';
      const bDone = b.status === 'done';
      if (!aDone && bDone) return -1;
      if (aDone && !bDone) return 1;
      if (!aDone && !bDone) return a.dueDate.localeCompare(b.dueDate);
      const aTime = a.completedAt ? new Date(a.completedAt).getTime() : new Date(a.dueDate || a.createdAt).getTime();
      const bTime = b.completedAt ? new Date(b.completedAt).getTime() : new Date(b.dueDate || b.createdAt).getTime();
      return bTime - aTime;
    });

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28 md:pb-12">
      <Navbar onOpenNewGoal={() => setIsGoalModalOpen(true)} onOpenNewTask={openNewTask} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        <PageHeader
          icon={Signpost}
          title="Future Tasks"
          subtitle="Exams, projects and deadlines. Soonest first, so nothing sneaks up on you."
        />

        <FilterPills label="Filter tasks by type" options={FILTERS} value={filterType} onChange={setFilterType} />

        {isLoading && <LoadingState message="Checking what's coming up…" />}

        {!isLoading && loadFailed && (
          <EmptyState
            icon={Signpost}
            title="Your tasks didn't load"
            body="Check your connection, then try again."
            action={
              <button type="button" onClick={handleRetryLoad} className={primaryButtonClass}>
                Try again
              </button>
            }
          />
        )}

        {!isLoading && !loadFailed && filteredTasks.length === 0 && (
          <EmptyState
            icon={Calendar}
            title={filterType === 'all' ? 'Nothing on the horizon' : 'Nothing of this type yet'}
            body="Add an exam, project or assignment and we'll break it into daily steps for you."
            action={
              <button type="button" onClick={openNewTask} className={primaryButtonClass}>
                <Plus className="w-4 h-4 stroke-[3]" />
                Add a task
              </button>
            }
          />
        )}

        <ul className="space-y-3">
          {filteredTasks.map((task, i) => {
            const type = TYPE_META[task.type] ?? TYPE_META.other;
            const TypeIcon = type.icon;
            const dueBadge = formatDueDateBadge(task.dueDate);
            const isDone = task.status === 'done';
            const hasEstimate = task.estimatedHours !== undefined && task.estimatedHours > 0;
            const progress =
              hasEstimate && task.estimatedHours
                ? isDone
                  ? 100
                  : Math.min(100, Math.round((task.hoursDone / task.estimatedHours) * 100))
                : 0;

            return (
              <motion.li
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), type: 'spring', stiffness: 260, damping: 26 }}
                className={`accent-deadline rounded-3xl p-4 sm:p-5 transition-colors ${
                  isDone ? 'bg-surface/60 border border-line' : 'bg-surface shadow-soft'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleToggleTaskStatus(task, e.currentTarget)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
                    className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-[3px] transition-all ${
                      isDone
                        ? 'bg-good border-good text-surface'
                        : 'border-trail text-transparent hover:border-good hover:text-good'
                    }`}
                  >
                    <Check className="w-4 h-4 stroke-[3.5]" />
                  </button>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-accent-ink">
                        <TypeIcon className="w-3.5 h-3.5" />
                        {type.label}
                      </span>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-good-soft text-good">
                          <Check className="w-3 h-3 stroke-[3]" />
                          Completed
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            dueBadge.isUrgent ? 'bg-danger-soft text-danger' : 'bg-sunk text-ink-muted'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          {dueBadge.text}
                        </span>
                      )}
                    </div>

                    <h2
                      className={`text-base sm:text-lg font-extrabold leading-snug ${
                        isDone ? 'line-through decoration-ink-muted/40 text-ink-muted' : ''
                      }`}
                    >
                      {task.title}
                    </h2>

                    {(task.weight !== undefined || task.estimatedHours !== undefined || task.size) && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-ink-muted">
                        {task.weight !== undefined && (
                          <span className="inline-flex items-center gap-0.5 bg-sunk px-2 py-0.5 rounded-full">
                            <Percent className="w-3 h-3" />
                            {task.weight}% of grade
                          </span>
                        )}
                        {task.estimatedHours !== undefined && (
                          <span className="inline-flex items-center gap-1 bg-sunk px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />~{task.estimatedHours}h
                          </span>
                        )}
                        {task.size && <span className="capitalize bg-sunk px-2 py-0.5 rounded-full">{task.size}</span>}
                      </div>
                    )}

                    {task.materials && (
                      <p className="flex items-start gap-1.5 text-sm text-ink-muted">
                        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{task.materials}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center shrink-0 -mr-1 -mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(task);
                        setIsTaskModalOpen(true);
                      }}
                      className={iconButtonClass}
                      aria-label={`Edit ${task.title}`}
                      title="Edit task"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-2 rounded-xl text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                      aria-label={`Delete ${task.title}`}
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 pt-3 border-t border-line space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs font-bold">
                    <span className="tabular-nums">
                      {hasEstimate
                        ? `${isDone ? task.estimatedHours : task.hoursDone}h of ~${task.estimatedHours}h done`
                        : `${task.hoursDone}h done`}
                    </span>
                    {hasEstimate && <span className="tabular-nums text-ink-muted">{progress}%</span>}
                  </div>

                  {hasEstimate && (
                    <div
                      className="w-full bg-sunk h-2.5 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress on ${task.title}`}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: 'spring', stiffness: 120, damping: 22 }}
                        className={`h-full rounded-full ${isDone ? 'bg-good' : 'bg-accent-gradient'}`}
                      />
                    </div>
                  )}
                </div>
              </motion.li>
            );
          })}
        </ul>
      </main>

      <NewTaskModal
        isOpen={isTaskModalOpen}
        initialData={editingTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
      />

      <NewGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onSave={handleSaveGoal} />
    </div>
  );
}

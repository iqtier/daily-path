'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, RotateCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import DaySetup from '@/components/DaySetup';
import DayTrail from '@/components/DayTrail';
import CompletionCelebration from '@/components/CompletionCelebration';
import BonusTimeCard from '@/components/BonusTimeCard';
import NewGoalModal from '@/components/NewGoalModal';
import NewTaskModal from '@/components/NewTaskModal';
import {
  getToday,
  getGoals,
  completeTask,
  addGoal,
  addFutureTask,
  getBonusTasks,
  MAX_BONUS_REQUESTS_PER_DAY,
} from '@/lib/api';
import {
  DailyPlanResponse,
  GoalCategory,
  GoalStatus,
  FutureTaskType,
  TaskSize,
  EstimateSource,
} from '@/lib/types';
import { accentForTask } from '@/lib/category-theme';

/**
 * Today's path: the current task on top, locked steps below it,
 * and finished steps at the bottom with their time comparison.
 */
export default function DashboardPage() {
  const [plan, setPlan] = useState<DailyPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [goalCategories, setGoalCategories] = useState<Record<string, GoalCategory>>({});
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFetchingBonus, setIsFetchingBonus] = useState(false);
  const [justFinishedDay, setJustFinishedDay] = useState(false);

  // State is only set inside promise callbacks, after the request settles, so the effect
  // below never updates state synchronously.
  const loadToday = useCallback(
    () =>
      getToday()
        .then((data) => {
          setPlan(data);
          setLoadFailed(false);
        })
        .catch((err) => {
          console.error('Failed to load daily plan:', err);
          setLoadFailed(true);
        })
        .finally(() => setIsLoading(false)),
    []
  );

  // The retry button shows the spinner again; that reset belongs in the event handler, not the loader.
  const handleRetryLoad = () => {
    setIsLoading(true);
    setLoadFailed(false);
    void loadToday();
  };

  useEffect(() => {
    void loadToday();

    // Tasks only carry the linked goal's id, so goals are loaded to color tasks by category.
    // A failure here only costs the accent colors, so it is not surfaced.
    let active = true;
    getGoals()
      .then((goals) => {
        if (active) setGoalCategories(Object.fromEntries(goals.map((g) => [g.id, g.category])));
      })
      .catch((err) => console.error('Failed to load goals for accents:', err));
    return () => {
      active = false;
    };
  }, [loadToday]);

  // Rethrows so TaskCard can show a retry message instead of silently staying put.
  const handleCompleteTask = async (taskId: string, timeSpentSeconds?: number) => {
    const updated = await completeTask(taskId, timeSpentSeconds);
    setJustFinishedDay(updated.totalTasks > 0 && updated.completedTasks >= updated.totalTasks);
    setPlan(updated);
  };

  // Reload after a bonus request so the new task appears as the current focus.
  const handleGetBonusTask = async () => {
    if (isFetchingBonus) return;
    setIsFetchingBonus(true);
    try {
      await getBonusTasks();
      setJustFinishedDay(false);
      setPlan(await getToday());
    } catch (err) {
      console.error('Failed to get bonus task:', err);
    } finally {
      setIsFetchingBonus(false);
    }
  };

  const handleSaveGoal = async (goalData: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => {
    const goal = await addGoal(goalData);
    setGoalCategories((prev) => ({ ...prev, [goal.id]: goal.category }));
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

  const currentTask = plan?.tasks.find((t) => !t.isCompleted && !t.isLocked);
  const upcomingTasks = plan?.tasks.filter((t) => t.isLocked && !t.isCompleted) ?? [];
  const completedTasks = plan?.tasks.filter((t) => t.isCompleted) ?? [];

  const isAllDone =
    plan !== null && plan.totalTasks > 0 && plan.completedTasks >= plan.totalTasks;

  // Minutes left = hours available minus time on each task
  // (actual timer time if recorded, otherwise the suggested estimate).
  const minutesLeft =
    isAllDone && plan
      ? Math.floor(
          plan.hoursAvailableToday * 60 -
            plan.tasks.reduce(
              (sum, t) =>
                sum +
                (t.timeSpentSeconds !== undefined ? t.timeSpentSeconds / 60 : (t.estimatedMinutes ?? 0)),
              0
            )
        )
      : 0;

  const bonusLimitReached = (plan?.bonusRequestsToday ?? 0) >= MAX_BONUS_REQUESTS_PER_DAY;

  // Also shown at the limit, to deliver the closing message.
  const showBonusCard = isAllDone && (minutesLeft >= 10 || bonusLimitReached);

  // Date only; the app never shows clock times.
  const formattedDate = plan
    ? (() => {
        try {
          const [y, m, d] = plan.date.split('-').map((p) => parseInt(p, 10));
          return new Date(y, m - 1, d).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return plan.date;
        }
      })()
    : 'Today';

  return (
    <div className="min-h-screen bg-canvas text-ink pb-28 md:pb-12">
      <Navbar
        onOpenNewGoal={() => setIsGoalModalOpen(true)}
        onOpenNewTask={() => setIsTaskModalOpen(true)}
      />

      {plan && !plan.hasPlan ? (
        <DaySetup
          date={plan.date}
          defaultHours={plan.defaultHoursAvailable}
          onGenerated={setPlan}
        />
      ) : (
        <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
          <header className="space-y-4">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-muted">
                Today&apos;s path
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-balance">
                {formattedDate}
              </h1>
            </div>
            {plan && plan.tasks.length > 0 && <DayTrail tasks={plan.tasks} />}
          </header>

          {isLoading && !plan && (
            <div className="py-16 text-center space-y-3" aria-live="polite">
              <motion.div
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                className="w-10 h-10 mx-auto rounded-full border-4 border-trail border-t-brand"
              />
              <p className="text-sm font-semibold text-ink-muted">Lining up your first move…</p>
            </div>
          )}

          {!isLoading && loadFailed && !plan && (
            <div role="alert" className="py-12 text-center space-y-4">
              <p className="text-base font-bold">Today&apos;s path didn&apos;t load.</p>
              <p className="text-sm text-ink-muted">Check your connection, then give it another go.</p>
              <button
                type="button"
                onClick={handleRetryLoad}
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-canvas bg-ink px-4 py-2.5 rounded-2xl"
              >
                <RotateCw className="w-4 h-4" />
                Try again
              </button>
            </div>
          )}

          {isAllDone && (
            <CompletionCelebration totalTasks={plan?.totalTasks ?? 0} celebrate={justFinishedDay} />
          )}

          {showBonusCard && (
            <BonusTimeCard
              minutesLeft={minutesLeft}
              limitReached={bonusLimitReached}
              isLoading={isFetchingBonus}
              onGetBonusTask={handleGetBonusTask}
            />
          )}

          {plan && (
            <div className="space-y-4">
              {currentTask && (
                <TaskCard
                  key={currentTask.id}
                  task={currentTask}
                  isFirstUnfinished={true}
                  onComplete={handleCompleteTask}
                  accent={accentForTask(currentTask, goalCategories)}
                />
              )}

              {upcomingTasks.length > 0 && (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isFirstUnfinished={false}
                      onComplete={handleCompleteTask}
                    />
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <section className="space-y-3 pt-3" aria-label="Done today">
                  <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-muted px-1">
                    <CheckCircle2 className="w-4 h-4 text-good" />
                    Done today ({completedTasks.length})
                  </h2>
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isFirstUnfinished={false}
                      onComplete={handleCompleteTask}
                      accent={accentForTask(task, goalCategories)}
                    />
                  ))}
                </section>
              )}
            </div>
          )}

          <p className="pt-4 pb-2 text-center text-xs font-semibold text-ink-muted">
            One step at a time. You&apos;ve got this.
          </p>
        </main>
      )}

      <NewGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveGoal}
      />

      <NewTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
      />
    </div>
  );
}

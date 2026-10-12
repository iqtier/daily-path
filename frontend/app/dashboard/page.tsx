'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import CompletionCelebration from '@/components/CompletionCelebration';
import NewGoalModal from '@/components/NewGoalModal';
import NewTaskModal from '@/components/NewTaskModal';
import BonusTimeCard from '@/components/BonusTimeCard';
import {
  getToday,
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
import { CheckCircle2 } from 'lucide-react';

/**
 * Dashboard Page
 * Main view for Daily Path. Shows today's focused single-task execution:
 * - Current focus is ALWAYS the top card
 * - Upcoming steps are shown below (locked)
 * - Completed tasks are grouped below with duration metrics
 */
export default function DashboardPage() {
  const [plan, setPlan] = useState<DailyPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isFetchingBonus, setIsFetchingBonus] = useState(false);

  useEffect(() => {
    let active = true;
    getToday()
      .then((data) => {
        if (active) {
          setPlan(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load daily plan:', err);
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Complete task handler
  const handleCompleteTask = async (
    taskId: string,
    timeSpentSeconds?: number
  ) => {
    try {
      const updated = await completeTask(taskId, timeSpentSeconds);
      setPlan(updated);
    } catch (err) {
      console.error('Failed to complete task:', err);
    }
  };

  // Bonus task handler: request a bonus task, then reload today's plan
  // so the new task shows up in the list as the current focus
  const handleGetBonusTask = async () => {
    if (isFetchingBonus) return;
    setIsFetchingBonus(true);
    try {
      await getBonusTasks();
      const updated = await getToday();
      setPlan(updated);
    } catch (err) {
      console.error('Failed to get bonus task:', err);
    } finally {
      setIsFetchingBonus(false);
    }
  };

  // Reset demo handler


  // Quick Goal creation from dashboard
  const handleSaveGoal = async (goalData: {
    title: string;
    details?: string;
    category: GoalCategory;
    status: GoalStatus;
  }) => {
    await addGoal(goalData);
  };

  // Quick Future Task creation from dashboard
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

  // Current Focus task is ALWAYS placed at the top
  const currentTask = plan?.tasks.find((t) => !t.isCompleted && !t.isLocked);
  const upcomingTasks = plan?.tasks.filter((t) => t.isLocked && !t.isCompleted) ?? [];
  const completedTasks = plan?.tasks.filter((t) => t.isCompleted) ?? [];

  const isAllDone =
    plan !== null &&
    plan.totalTasks > 0 &&
    plan.completedTasks >= plan.totalTasks;

  // Bonus time: once everything is done, minutes left =
  // hoursAvailableToday x 60 minus time spent on each task
  // (actual timer time if recorded, otherwise the suggested estimate)
  const minutesLeft =
    isAllDone && plan
      ? Math.floor(
          plan.hoursAvailableToday * 60 -
            plan.tasks.reduce(
              (sum, t) =>
                sum +
                (t.timeSpentSeconds !== undefined
                  ? t.timeSpentSeconds / 60
                  : t.estimatedMinutes ?? 0),
              0
            )
        )
      : 0;

  // Daily bonus limit: after 3 requests the button is replaced by a closing message
  const bonusLimitReached =
    (plan?.bonusRequestsToday ?? 0) >= MAX_BONUS_REQUESTS_PER_DAY;

  // Show the bonus card when 10+ minutes remain, or to show the closing message
  const showBonusCard = isAllDone && (minutesLeft >= 10 || bonusLimitReached);

  // Format date peacefully without clock time
  const formattedDate = plan
    ? (() => {
        try {
          const parts = plan.date.split('-');
          const d = new Date(
            parseInt(parts[0]),
            parseInt(parts[1]) - 1,
            parseInt(parts[2])
          );
          return d.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          });
        } catch {
          return plan.date;
        }
      })()
    : 'Today';

  const progressPercent = plan
    ? Math.round((plan.completedTasks / plan.totalTasks) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-stone-50/70 text-stone-900 pb-24 md:pb-12">
      {/* Top Navbar */}
      <Navbar
        onOpenNewGoal={() => setIsGoalModalOpen(true)}
        onOpenNewTask={() => setIsTaskModalOpen(true)}
       
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6">
        {/* Header with today's date and progress */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-stone-600">
                Today&apos;s Focus
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                {formattedDate}
              </h1>
            </div>

            {/* Progress counter: "1 of 4 done" */}
            {plan && (
              <div className="flex items-center gap-2 text-sm font-medium text-stone-700 bg-white border border-stone-200/80 px-3.5 py-1.5 rounded-full shadow-xs self-start sm:self-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.2]" />
                <span>
                  <strong className="text-stone-900">
                    {plan.completedTasks}
                  </strong>{' '}
                  of {plan.totalTasks} done
                </span>
              </div>
            )}
          </div>

          {/* Gentle Progress Bar */}
          {plan && (
            <div className="w-full bg-stone-200/80 h-2 rounded-full overflow-hidden">
              <div
                className="bg-stone-900 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && !plan && (
          <div className="py-16 text-center text-stone-600 space-y-2">
            <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-900 rounded-full animate-spin mx-auto" />
            <p className="text-sm">Preparing today&apos;s daily path...</p>
          </div>
        )}

        {/* All tasks finished state */}
        {isAllDone && (
          <CompletionCelebration
            totalTasks={plan?.totalTasks ?? 4}
            
          />
        )}

        {/* Bonus time card (sits right under "You're done for today") */}
        {showBonusCard && (
          <BonusTimeCard
            minutesLeft={minutesLeft}
            limitReached={bonusLimitReached}
            isLoading={isFetchingBonus}
            onGetBonusTask={handleGetBonusTask}
          />
        )}

        {/* Today's Tasks: Current Focus is ALWAYS top */}
        {plan && (
          <div className="space-y-4">
            {/* 1. CURRENT FOCUS (Top Card) */}
            {currentTask && (
              <TaskCard
                key={currentTask.id}
                task={currentTask}
                isFirstUnfinished={true}
                onComplete={handleCompleteTask}
              />
            )}

            {/* 2. UPCOMING STEPS (Locked & Blurred) */}
            {upcomingTasks.length > 0 && (
              <div className="space-y-3 pt-1">
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

            {/* 3. COMPLETED EARLIER TODAY (Checked & Faded with comparisons) */}
            {completedTasks.length > 0 && (
              <div className="space-y-3 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500 px-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completed Today ({completedTasks.length})</span>
                </div>
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isFirstUnfinished={false}
                    onComplete={handleCompleteTask}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mindful footer note */}
        <div className="pt-4 pb-2 text-center text-xs text-stone-600">
          Focus on one step at a time. The rest of your path unfolds naturally.
        </div>
      </main>

      {/* Modal Dialogs */}
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

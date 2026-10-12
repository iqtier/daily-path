/**
 * Daily Path data models, matching the backend API contract.
 */

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  hoursPerDay?: number;
  createdAt: string;
}

export type GoalCategory = 'fitness' | 'career' | 'learning' | 'health' | 'personal' | 'other';
export type GoalStatus = 'active' | 'paused' | 'achieved';

export interface Goal {
  id: string;
  userId?: string;
  title: string;
  details?: string;
  category: GoalCategory;
  status: GoalStatus;
  completedTodoCount: number;
  createdAt: string;
}

export type FutureTaskType = 'assignment' | 'exam' | 'project' | 'other';
export type FutureTaskStatus = 'pending' | 'done';
export type TaskSize = 'small' | 'medium' | 'large' | 'huge';
export type EstimateSource = 'user' | 'size' | 'ai';

export interface FutureTask {
  id: string;
  userId?: string;
  title: string;
  type: FutureTaskType;
  dueDate: string; // YYYY-MM-DD
  weight?: number;
  estimatedHours?: number;
  timeSpentMinutes: number; // From completed daily tasks linked to this task
  hoursDone: number; // Derived from timeSpentMinutes
  size?: TaskSize;
  estimateSource?: EstimateSource;
  materials?: string;
  status: FutureTaskStatus;
  completedAt?: string;
  createdAt: string;
}

/** Exactly one linked entity: a goal or a future task. */
export interface LinkedEntity {
  type: 'goal' | 'futureTask';
  id: string;
  title: string;
}

/**
 * Locked tasks contain only id, order, and isLocked.
 * estimatedMinutes is present only once the task is completed.
 */
export interface DailyTaskItem {
  id: string;
  order: number;
  isLocked: boolean;
  title?: string;
  description?: string;
  reason?: string;
  linkedTo?: LinkedEntity;
  estimatedMinutes?: number;
  timeSpentSeconds?: number;
  isCompleted?: boolean;
  completedAt?: string;
  startedAt?: string;
  isBonus?: boolean;
}

export interface DailyPlanResponse {
  date: string; // YYYY-MM-DD in the user's time zone
  hasPlan: boolean; // False until today's plan is generated
  defaultHoursAvailable: number; // Pre-fills the setup screen
  totalTasks: number;
  completedTasks: number;
  hoursAvailableToday: number;
  remainingMinutes?: number;
  bonusRequestsLeft: number;
  bonusRequestsToday: number; // Derived from bonusRequestsLeft
  tasks: DailyTaskItem[];
}

export interface GoalTodoHistoryItem {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  completedAt: string;
  date: string; // YYYY-MM-DD, use this for grouping
  timeSpentSeconds?: number;
}

export interface GoalNote {
  id: string;
  goalId: string;
  content: string;
  createdAt: string;
}
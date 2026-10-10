/**
 * Daily Path — Data Models & API Types
 * Represents User, Goal, FutureTask, DailyPlan, DailyTask, and GoalTodoHistoryItem
 */

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string; // e.g., 'America/Toronto'
  hoursPerDay?: number; // Optional work capacity per day
  createdAt: string;
}

export type GoalCategory =
  | 'fitness'
  | 'career'
  | 'learning'
  | 'health'
  | 'personal'
  | 'other';

export type GoalStatus = 'active' | 'paused' | 'achieved';

export interface Goal {
  id: string;
  userId: string;
  title: string;
  details?: string;
  category: GoalCategory;
  status: GoalStatus;
  completedTodoCount: number; // Count of completed daily to-dos linked to this goal
  createdAt: string;
}

export type FutureTaskType = 'assignment' | 'exam' | 'project' | 'other';
export type FutureTaskStatus = 'pending' | 'done';
export type TaskSize = 'small' | 'medium' | 'large' | 'huge';
export type EstimateSource = 'user' | 'size' | 'ai';

export interface FutureTask {
  id: string;
  userId: string;
  title: string;
  type: FutureTaskType;
  dueDate: string; // YYYY-MM-DD
  weight?: number; // Optional percent of final grade
  estimatedHours?: number; // User's guess of total effort
  hoursDone: number; // Hours completed so far from linked to-dos
  size?: TaskSize; // Optional task size category
  estimateSource?: EstimateSource; // Origin of effort estimate
  materials?: string; // Chapters, topics, instructions
  status: FutureTaskStatus;
  completedAt?: string; // ISO timestamp when marked done
  createdAt: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  generatedAt: string;
}

/**
 * Exactly one linked entity: either one goal OR one future task, never both, never neither
 */
export interface LinkedEntity {
  type: 'goal' | 'futureTask';
  id: string;
  title: string;
}

/**
 * DailyTaskItem
 * Matches the backend API contract for /api/today:
 * Locked tasks contain ONLY id, order, and isLocked: true (no title or text).
 * When unlocked, title, description, reason, and linkedTo (one goal OR futureTask) are present.
 * estimatedMinutes is ONLY present when isCompleted is true.
 */
export interface DailyTaskItem {
  id: string;
  order: number;
  isLocked: boolean;
  title?: string;
  description?: string;
  reason?: string;
  linkedTo?: LinkedEntity; // Exactly one goal OR one future task
  estimatedMinutes?: number; // AI suggested minutes; only visible once completed!
  timeSpentSeconds?: number; // Actual time recorded by stopwatch
  isCompleted?: boolean;
  completedAt?: string;
  startedAt?: string;
  isBonus?: boolean; // True for extra tasks requested after the day's plan is finished
}

export interface DailyPlanResponse {
  date: string;
  totalTasks: number;
  completedTasks: number;
  hoursAvailableToday: number; // How many hours the user has for tasks today
  bonusRequestsToday?: number; // How many times "Get bonus task" was used today
  tasks: DailyTaskItem[];
}

/**
 * Goal history entry representing a completed daily to-do linked to a goal
 */
export interface GoalTodoHistoryItem {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  completedAt: string;
  date: string; // YYYY-MM-DD for grouping
  timeSpentSeconds?: number;
}

/**
 * Text-based note or reflection specifically associated with a goal
 */
export interface GoalNote {
  id: string;
  goalId: string;
  content: string;
  createdAt: string; // ISO timestamp
}

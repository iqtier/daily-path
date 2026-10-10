/**
 * Daily Path — Unified Frontend API Client
 *
 * All data calls flow through this module. Currently backed by mock storage
 * with localStorage persistence so interactions (timer, completing tasks,
 * adding goals/tasks) persist across reloads.
 *
 * Later, this file can be pointed directly at the real backend API endpoints:
 * - GET    /api/today
 * - POST   /api/today/tasks/{id}/complete
 * - POST   /api/today/bonus
 * - GET    /api/goals
 * - POST   /api/goals
 * - PUT    /api/goals/{id}
 * - DELETE /api/goals/{id}
 * - GET    /api/future-tasks
 * - POST   /api/future-tasks
 * - PUT    /api/future-tasks/{id}
 * - DELETE /api/future-tasks/{id}
 * - POST   /api/auth/login
 * - POST   /api/auth/register
 */

import {
  DailyPlanResponse,
  Goal,
  FutureTask,
  User,
  DailyTaskItem,
  GoalTodoHistoryItem,
  GoalNote,
} from './types';
import {
  initialDailyPlanResponse,
  initialGoals,
  initialFutureTasks,
  initialUser,
  allDailyTasksDefinition,
  bonusTaskDefinitions,
  initialGoalHistory,
  initialGoalNotes,
} from './mockData';

const STORAGE_KEYS = {
  DAILY_PLAN: 'daily_path_plan_v1',
  GOALS: 'daily_path_goals_v1',
  GOAL_HISTORY: 'daily_path_goal_history_v1',
  GOAL_NOTES: 'daily_path_goal_notes_v1',
  FUTURE_TASKS: 'daily_path_future_tasks_v1',
  USER: 'daily_path_user_v1',
  AUTH_TOKEN: 'daily_path_auth_token_v1',
};

// Artificial delay to simulate realistic network latency
const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper to safely read from localStorage
 */
function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

/**
 * Helper to safely write to localStorage
 */
function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err);
  }
}

// -----------------------------------------------------------------------------
// Daily Tasks API (/api/today)
// -----------------------------------------------------------------------------

// Max number of times the user can ask for a bonus task in one day
export const MAX_BONUS_REQUESTS_PER_DAY = 3;

/**
 * Read today's plan from storage.
 * Plans saved before the bonus feature existed lack the new fields,
 * so fill them in from the initial mock data.
 */
function readDailyPlan(): DailyPlanResponse {
  const plan = readStorage<DailyPlanResponse>(
    STORAGE_KEYS.DAILY_PLAN,
    initialDailyPlanResponse
  );
  return {
    ...plan,
    hoursAvailableToday:
      plan.hoursAvailableToday ?? initialDailyPlanResponse.hoursAvailableToday,
    bonusRequestsToday: plan.bonusRequestsToday ?? 0,
  };
}

/**
 * Fetch today's daily task list.
 * In a real backend, if none exists yet, the backend generates it first with AI.
 */
export async function getToday(): Promise<DailyPlanResponse> {
  await delay(100);
  return readDailyPlan();
}

/**
 * Mark a daily task complete.
 * Security rules enforced:
 * 1. Only the first unfinished task can be completed.
 * 2. timeSpentSeconds must be between 0 and 86400 (24h).
 * 3. Locked tasks remain locked until the prior task is marked done.
 * 4. estimatedMinutes is only revealed for completed tasks.
 */
export async function completeTask(
  id: string,
  timeSpentSeconds?: number
): Promise<DailyPlanResponse> {
  await delay(200);

  // Validate timeSpentSeconds if provided
  if (timeSpentSeconds !== undefined) {
    if (timeSpentSeconds < 0 || timeSpentSeconds > 86400) {
      throw new Error('Invalid timeSpentSeconds: must be between 0 and 24 hours');
    }
  }

  const currentPlan = readDailyPlan();

  // Find the first unfinished task in order
  const firstUnfinished = currentPlan.tasks.find(
    (t) => !t.isCompleted && !t.isLocked
  );

  if (!firstUnfinished || firstUnfinished.id !== id) {
    throw new Error('Security violation: Only the first unfinished task can be marked complete');
  }

  // Complete the target task (bonus tasks have their own definitions)
  const taskDef = allDailyTasksDefinition[id] ?? bonusTaskDefinitions[id];
  const updatedTasks: DailyTaskItem[] = currentPlan.tasks.map((task) => {
    if (task.id === id) {
      return {
        ...task,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: timeSpentSeconds !== undefined ? timeSpentSeconds : undefined,
        // Backend now reveals the estimatedMinutes because the task is done
        estimatedMinutes: taskDef ? taskDef.estimatedMinutes : 25,
      };
    }
    return task;
  });

  // Find the next task in order to unlock it
  const completedTaskOrder = firstUnfinished.order;
  const nextTask = updatedTasks.find((t) => t.order === completedTaskOrder + 1);

  if (nextTask && nextTask.isLocked) {
    const nextDef = allDailyTasksDefinition[nextTask.id];
    if (nextDef) {
      nextTask.isLocked = false;
      nextTask.isCompleted = false;
      nextTask.title = nextDef.title;
      nextTask.description = nextDef.description;
      nextTask.reason = nextDef.reason;
      nextTask.linkedTo = nextDef.linkedTo;
      // Do NOT send estimatedMinutes until nextTask is completed!
      delete nextTask.estimatedMinutes;
    }
  }

  const completedCount = updatedTasks.filter((t) => t.isCompleted).length;

  const updatedPlan: DailyPlanResponse = {
    ...currentPlan,
    completedTasks: completedCount,
    tasks: updatedTasks,
  };

  writeStorage(STORAGE_KEYS.DAILY_PLAN, updatedPlan);
  return updatedPlan;
}

/**
 * Request bonus tasks for leftover time once today's plan is finished.
 * For now this returns 1 mock task linked to a goal, marked isBonus: true.
 * The task is also added to today's plan so the normal timer and
 * "Mark done" flow (completeTask) work on it.
 * Limited to MAX_BONUS_REQUESTS_PER_DAY requests per day.
 */
export async function getBonusTasks(): Promise<DailyTaskItem[]> {
  await delay(200);

  const currentPlan = readDailyPlan();
  const requestsSoFar = currentPlan.bonusRequestsToday ?? 0;

  if (requestsSoFar >= MAX_BONUS_REQUESTS_PER_DAY) {
    throw new Error('Bonus task limit reached for today');
  }
  if (currentPlan.tasks.some((t) => !t.isCompleted)) {
    throw new Error("Finish today's tasks before requesting a bonus task");
  }

  // Pick the next bonus definition (bonus_1, bonus_2, bonus_3)
  const bonusId = `bonus_${requestsSoFar + 1}`;
  const def = bonusTaskDefinitions[bonusId];
  const lastOrder = Math.max(0, ...currentPlan.tasks.map((t) => t.order));

  // Same shape as a normal unlocked task; estimatedMinutes stays hidden until done
  const bonusTask: DailyTaskItem = {
    id: bonusId,
    order: lastOrder + 1,
    title: def.title,
    description: def.description,
    reason: def.reason,
    linkedTo: def.linkedTo,
    isCompleted: false,
    isLocked: false,
    isBonus: true,
  };

  // Save it into today's plan so it shows up and can be completed like any task
  const updatedPlan: DailyPlanResponse = {
    ...currentPlan,
    totalTasks: currentPlan.totalTasks + 1,
    bonusRequestsToday: requestsSoFar + 1,
    tasks: [...currentPlan.tasks, bonusTask],
  };

  writeStorage(STORAGE_KEYS.DAILY_PLAN, updatedPlan);
  return [bonusTask];
}

/**
 * Resets the demo daily plan back to initial state
 */
export async function resetDemoData(): Promise<DailyPlanResponse> {
  await delay(100);
  writeStorage(STORAGE_KEYS.DAILY_PLAN, initialDailyPlanResponse);
  writeStorage(STORAGE_KEYS.GOALS, initialGoals);
  writeStorage(STORAGE_KEYS.GOAL_HISTORY, initialGoalHistory);
  writeStorage(STORAGE_KEYS.GOAL_NOTES, initialGoalNotes);
  writeStorage(STORAGE_KEYS.FUTURE_TASKS, initialFutureTasks);
  // Clear any active timer localStorage as well
  if (typeof window !== 'undefined') {
    localStorage.removeItem('daily_path_timer_state_v1');
  }
  return initialDailyPlanResponse;
}

// -----------------------------------------------------------------------------
// Goals API (/api/goals)
// -----------------------------------------------------------------------------

/**
 * List all user goals
 */
export async function getGoals(): Promise<Goal[]> {
  await delay(100);
  return readStorage<Goal[]>(STORAGE_KEYS.GOALS, initialGoals);
}

/**
 * Fetch a single goal by its id
 */
export async function getGoal(id: string): Promise<Goal | null> {
  await delay(80);
  const goals = await getGoals();
  return goals.find((g) => g.id === id) || null;
}

/**
 * Fetch history of completed daily to-dos linked to a specific goal
 */
export async function getGoalHistory(
  goalId: string
): Promise<GoalTodoHistoryItem[]> {
  await delay(120);
  const historyMap = readStorage<Record<string, GoalTodoHistoryItem[]>>(
    STORAGE_KEYS.GOAL_HISTORY,
    initialGoalHistory
  );
  return historyMap[goalId] || [];
}

/**
 * Fetch text-based notes and reflections specifically linked to a goal
 */
export async function getGoalNotes(goalId: string): Promise<GoalNote[]> {
  await delay(100);
  const notesMap = readStorage<Record<string, GoalNote[]>>(
    STORAGE_KEYS.GOAL_NOTES,
    initialGoalNotes
  );
  const notes = notesMap[goalId] || [];
  // Sort newest first by creation timestamp
  return [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Add a new note or reflection to a specific goal
 */
export async function addGoalNote(
  goalId: string,
  content: string
): Promise<GoalNote> {
  await delay(150);
  const notesMap = readStorage<Record<string, GoalNote[]>>(
    STORAGE_KEYS.GOAL_NOTES,
    initialGoalNotes
  );
  const currentList = notesMap[goalId] || [];

  const newNote: GoalNote = {
    id: `note_${Date.now()}`,
    goalId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  const updatedMap = {
    ...notesMap,
    [goalId]: [newNote, ...currentList],
  };

  writeStorage(STORAGE_KEYS.GOAL_NOTES, updatedMap);
  return newNote;
}

/**
 * Update an existing note or reflection on a specific goal
 */
export async function updateGoalNote(
  goalId: string,
  noteId: string,
  content: string
): Promise<GoalNote> {
  await delay(120);
  const notesMap = readStorage<Record<string, GoalNote[]>>(
    STORAGE_KEYS.GOAL_NOTES,
    initialGoalNotes
  );
  const currentList = notesMap[goalId] || [];
  const index = currentList.findIndex((n) => n.id === noteId);
  if (index === -1) {
    throw new Error('Note not found');
  }

  const updatedNote: GoalNote = {
    ...currentList[index],
    content: content.trim(),
  };

  const updatedList = [...currentList];
  updatedList[index] = updatedNote;

  const updatedMap = {
    ...notesMap,
    [goalId]: updatedList,
  };

  writeStorage(STORAGE_KEYS.GOAL_NOTES, updatedMap);
  return updatedNote;
}

/**
 * Delete a note from a specific goal
 */
export async function deleteGoalNote(
  goalId: string,
  noteId: string
): Promise<boolean> {
  await delay(120);
  const notesMap = readStorage<Record<string, GoalNote[]>>(
    STORAGE_KEYS.GOAL_NOTES,
    initialGoalNotes
  );
  const currentList = notesMap[goalId] || [];
  const filtered = currentList.filter((n) => n.id !== noteId);

  const updatedMap = {
    ...notesMap,
    [goalId]: filtered,
  };

  writeStorage(STORAGE_KEYS.GOAL_NOTES, updatedMap);
  return true;
}

/**
 * Add a new goal
 */
export async function addGoal(
  goalData: Omit<Goal, 'id' | 'userId' | 'createdAt' | 'completedTodoCount'> & {
    completedTodoCount?: number;
  }
): Promise<Goal> {
  await delay(150);
  const currentGoals = await getGoals();
  const user = await getCurrentUser();

  const newGoal: Goal = {
    ...goalData,
    completedTodoCount: goalData.completedTodoCount ?? 0,
    id: `g_${Date.now()}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  };

  const updated = [newGoal, ...currentGoals];
  writeStorage(STORAGE_KEYS.GOALS, updated);
  return newGoal;
}

/**
 * Update an existing goal
 */
export async function updateGoal(
  id: string,
  updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>
): Promise<Goal> {
  await delay(150);
  const currentGoals = await getGoals();
  const index = currentGoals.findIndex((g) => g.id === id);
  if (index === -1) {
    throw new Error('Goal not found');
  }

  const updatedGoal: Goal = {
    ...currentGoals[index],
    ...updates,
  };

  currentGoals[index] = updatedGoal;
  writeStorage(STORAGE_KEYS.GOALS, currentGoals);
  return updatedGoal;
}

/**
 * Delete a goal
 */
export async function deleteGoal(id: string): Promise<boolean> {
  await delay(150);
  const currentGoals = await getGoals();
  const filtered = currentGoals.filter((g) => g.id !== id);
  writeStorage(STORAGE_KEYS.GOALS, filtered);
  return true;
}

// -----------------------------------------------------------------------------
// Future Tasks API (/api/future-tasks)
// -----------------------------------------------------------------------------

/**
 * List all future tasks:
 * - Pending tasks first, sorted by due date ascending
 * - Done tasks at the bottom, sorted by most recently completed first (or dueDate/createdAt)
 */
export async function getFutureTasks(): Promise<FutureTask[]> {
  await delay(100);
  const tasks = readStorage<FutureTask[]>(
    STORAGE_KEYS.FUTURE_TASKS,
    initialFutureTasks
  );

  const pending = tasks
    .filter((t) => t.status !== 'done')
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  const done = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => {
      const aTime = a.completedAt
        ? new Date(a.completedAt).getTime()
        : new Date(a.dueDate || a.createdAt).getTime();
      const bTime = b.completedAt
        ? new Date(b.completedAt).getTime()
        : new Date(b.dueDate || b.createdAt).getTime();
      return bTime - aTime;
    });

  return [...pending, ...done];
}

/**
 * Add a new future task
 */
export async function addFutureTask(
  taskData: Omit<FutureTask, 'id' | 'userId' | 'createdAt' | 'status' | 'hoursDone'> & {
    hoursDone?: number;
  }
): Promise<FutureTask> {
  await delay(150);
  const currentTasks = readStorage<FutureTask[]>(
    STORAGE_KEYS.FUTURE_TASKS,
    initialFutureTasks
  );
  const user = await getCurrentUser();

  const newTask: FutureTask = {
    ...taskData,
    hoursDone: taskData.hoursDone ?? 0,
    id: `ft_${Date.now()}`,
    userId: user.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const updated = [...currentTasks, newTask];
  writeStorage(STORAGE_KEYS.FUTURE_TASKS, updated);
  return newTask;
}

/**
 * Update a future task
 */
export async function updateFutureTask(
  id: string,
  updates: Partial<Omit<FutureTask, 'id' | 'userId' | 'createdAt'>>
): Promise<FutureTask> {
  await delay(150);
  const currentTasks = readStorage<FutureTask[]>(
    STORAGE_KEYS.FUTURE_TASKS,
    initialFutureTasks
  );
  const index = currentTasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('Task not found');
  }

  const updatedTask: FutureTask = {
    ...currentTasks[index],
    ...updates,
  };

  currentTasks[index] = updatedTask;
  writeStorage(STORAGE_KEYS.FUTURE_TASKS, currentTasks);
  return updatedTask;
}

/**
 * Delete a future task
 */
export async function deleteFutureTask(id: string): Promise<boolean> {
  await delay(150);
  const currentTasks = readStorage<FutureTask[]>(
    STORAGE_KEYS.FUTURE_TASKS,
    initialFutureTasks
  );
  const filtered = currentTasks.filter((t) => t.id !== id);
  writeStorage(STORAGE_KEYS.FUTURE_TASKS, filtered);
  return true;
}

// -----------------------------------------------------------------------------
// Auth & User API (/api/auth)
// -----------------------------------------------------------------------------

/**
 * Get the currently logged-in user
 */
export async function getCurrentUser(): Promise<User> {
  return readStorage<User>(STORAGE_KEYS.USER, initialUser);
}

/**
 * Mock login
 */
export async function login(
  email: string,
  _password: string
): Promise<{ user: User; token: string }> {
  await delay(200);
  const user: User = {
    ...initialUser,
    email: email || initialUser.email,
  };
  writeStorage(STORAGE_KEYS.USER, user);
  writeStorage(STORAGE_KEYS.AUTH_TOKEN, 'mock_jwt_token_daily_path_123');
  return { user, token: 'mock_jwt_token_daily_path_123' };
}

/**
 * Mock register
 */
export async function register(
  email: string,
  _password: string,
  name?: string
): Promise<{ user: User; token: string }> {
  await delay(200);
  const user: User = {
    id: `usr_${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Toronto',
    hoursPerDay: 4,
    createdAt: new Date().toISOString(),
  };
  writeStorage(STORAGE_KEYS.USER, user);
  writeStorage(STORAGE_KEYS.AUTH_TOKEN, 'mock_jwt_token_daily_path_123');
  return { user, token: 'mock_jwt_token_daily_path_123' };
}

/**
 * Mock logout
 */
export async function logout(): Promise<void> {
  await delay(100);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
}

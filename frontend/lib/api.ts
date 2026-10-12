/**
 * Daily Path API client.
 *
 * All requests go to /api/*, which Next.js proxies to the ASP.NET Core backend
 * (see next.config). Authentication uses an HttpOnly cookie set at login, so no
 * token is stored or sent from JavaScript.
 *
 * Responses are adapted to the shapes in ./types so components stay decoupled
 * from the wire format.
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


export const MAX_BONUS_REQUESTS_PER_DAY = 3;

// -----------------------------------------------------------------------------
// HTTP helper
// -----------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Sends a request to the backend and parses JSON.
 * Throws ApiError with the server's message on non-2xx responses.
 * Redirects to /login on 401 for non-auth endpoints.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (res.status === 401 && !path.startsWith('/auth/') && typeof window !== 'undefined') {
    window.location.href = '/login';
  }

  const text = await res.text();

  // Null fields are dropped so they read as undefined, matching optional types.
  const body = text ? JSON.parse(text, (_key, value) => (value === null ? undefined : value)) : undefined;

  if (!res.ok) {
    throw new ApiError(res.status, extractErrorMessage(body) ?? `Request failed (${res.status})`);
  }

  return body as T;
}

/** Reads the message from { error } or from ASP.NET validation problem details. */
function extractErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as { error?: string; title?: string; errors?: Record<string, string[]> };
  if (b.error) return b.error;
  const firstValidationError = b.errors ? Object.values(b.errors).flat()[0] : undefined;
  return firstValidationError ?? b.title;
}

const json = (data: unknown): RequestInit => ({ body: JSON.stringify(data) });

// -----------------------------------------------------------------------------
// Today (/api/today)
// -----------------------------------------------------------------------------

type TodayWire = Omit<DailyPlanResponse, 'hoursAvailableToday' | 'bonusRequestsToday'> & {
  hoursAvailableToday?: number;
};

function toDailyPlan(r: TodayWire): DailyPlanResponse {
  return {
    ...r,
    hoursAvailableToday: r.hoursAvailableToday ?? r.defaultHoursAvailable,
    bonusRequestsToday: MAX_BONUS_REQUESTS_PER_DAY - r.bonusRequestsLeft,
  };
}

/** Today's plan. When hasPlan is false, show the setup screen and call generateToday. */
export async function getToday(): Promise<DailyPlanResponse> {
  return toDailyPlan(await request<TodayWire>('/today'));
}

/** Generates today's plan with the AI. Returns the existing plan if one was already made. */
export async function generateToday(hoursAvailable: number): Promise<DailyPlanResponse> {
  return toDailyPlan(
    await request<TodayWire>('/today', { method: 'POST', ...json({ hoursAvailable }) })
  );
}

/** Completes the current task. The server rejects any task that is not first in line. */
export async function completeTask(id: string, timeSpentSeconds?: number): Promise<DailyPlanResponse> {
  return toDailyPlan(
    await request<TodayWire>(`/today/tasks/${id}/complete`, {
      method: 'POST',
      ...json({ timeSpentSeconds: timeSpentSeconds ?? null }),
    })
  );
}

/** Requests bonus tasks and returns the full updated plan. */
export async function requestBonus(): Promise<DailyPlanResponse> {
  return toDailyPlan(await request<TodayWire>('/today/bonus', { method: 'POST' }));
}

/** Requests bonus tasks and returns only the newly added, unfinished bonus tasks. */
export async function getBonusTasks(): Promise<DailyTaskItem[]> {
  const plan = await requestBonus();
  return plan.tasks.filter((t) => t.isBonus && !t.isCompleted);
}

// -----------------------------------------------------------------------------
// Goals (/api/goals)
// -----------------------------------------------------------------------------

type GoalInput = Pick<Goal, 'title' | 'details' | 'category' | 'status'>;

export async function getGoals(): Promise<Goal[]> {
  return request<Goal[]>('/goals');
}

export async function getGoal(id: string): Promise<Goal | null> {
  const goals = await getGoals();
  return goals.find((g) => g.id === id) ?? null;
}

type GoalHistoryWire = Omit<GoalTodoHistoryItem, 'goalId' | 'timeSpentSeconds'> & {
  timeSpentMinutes?: number;
};

export async function getGoalHistory(goalId: string): Promise<GoalTodoHistoryItem[]> {
  const items = await request<GoalHistoryWire[]>(`/goals/${goalId}/history`);
  return items.map(({ timeSpentMinutes, ...item }) => ({
    ...item,
    goalId,
    timeSpentSeconds: timeSpentMinutes !== undefined ? timeSpentMinutes * 60 : undefined,
  }));
}

export async function addGoal(goalData: GoalInput & { completedTodoCount?: number }): Promise<Goal> {
  const { title, details, category, status } = goalData;
  return request<Goal>('/goals', { method: 'POST', ...json({ title, details, category, status }) });
}

/** The API replaces the whole goal, so partial updates are merged onto the current values. */
export async function updateGoal(
  id: string,
  updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>
): Promise<Goal> {
  const current = await getGoal(id);
  if (!current) throw new ApiError(404, 'Goal not found');

  const merged = { ...current, ...updates };
  return request<Goal>(`/goals/${id}`, {
    method: 'PUT',
    ...json({
      title: merged.title,
      details: merged.details,
      category: merged.category,
      status: merged.status,
    }),
  });
}

export async function deleteGoal(id: string): Promise<boolean> {
  await request<void>(`/goals/${id}`, { method: 'DELETE' });
  return true;
}

// -----------------------------------------------------------------------------
// Goal notes
// TODO: No backend endpoint yet. Notes are stored in this browser only.
// -----------------------------------------------------------------------------

const NOTES_KEY = 'daily_path_goal_notes_v1';

   function readNotes(): Record<string, GoalNote[]> {
     if (typeof window === 'undefined') return {};
     try {
       const item = localStorage.getItem(NOTES_KEY);
       return item ? JSON.parse(item) : {};
     } catch {
       return {};
     }
   }

function writeNotes(notes: Record<string, GoalNote[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // Storage may be unavailable (private mode, quota). Notes are non-critical.
  }
}

export async function getGoalNotes(goalId: string): Promise<GoalNote[]> {
  const notes = readNotes()[goalId] ?? [];
  return [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addGoalNote(goalId: string, content: string): Promise<GoalNote> {
  const all = readNotes();
  const note: GoalNote = {
    id: `note_${Date.now()}`,
    goalId,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };
  writeNotes({ ...all, [goalId]: [note, ...(all[goalId] ?? [])] });
  return note;
}

export async function updateGoalNote(goalId: string, noteId: string, content: string): Promise<GoalNote> {
  const all = readNotes();
  const list = all[goalId] ?? [];
  const index = list.findIndex((n) => n.id === noteId);
  if (index === -1) throw new Error('Note not found');

  const updated = { ...list[index], content: content.trim() };
  const newList = [...list];
  newList[index] = updated;
  writeNotes({ ...all, [goalId]: newList });
  return updated;
}

export async function deleteGoalNote(goalId: string, noteId: string): Promise<boolean> {
  const all = readNotes();
  writeNotes({ ...all, [goalId]: (all[goalId] ?? []).filter((n) => n.id !== noteId) });
  return true;
}

// -----------------------------------------------------------------------------
// Future tasks (/api/future-tasks)
// -----------------------------------------------------------------------------

type FutureTaskWire = Omit<FutureTask, 'hoursDone'>;

const toFutureTask = (t: FutureTaskWire): FutureTask => ({
  ...t,
  hoursDone: Math.round((t.timeSpentMinutes / 60) * 100) / 100,
});

type FutureTaskInput = Omit<
  FutureTask,
  'id' | 'userId' | 'createdAt' | 'status' | 'hoursDone' | 'timeSpentMinutes' | 'estimateSource' | 'completedAt'
>;

function toFutureTaskBody(t: FutureTaskInput & { status?: FutureTask['status'] }) {
  return {
    title: t.title,
    type: t.type,
    dueDate: t.dueDate,
    weight: t.weight,
    size: t.size,
    estimatedHours: t.estimatedHours,
    materials: t.materials,
    status: t.status ?? 'pending',
  };
}

/** Pending tasks first by due date, then done tasks, most recent first (sorted by the API). */
export async function getFutureTasks(): Promise<FutureTask[]> {
  const tasks = await request<FutureTaskWire[]>('/future-tasks');
  return tasks.map(toFutureTask);
}

export async function addFutureTask(taskData: FutureTaskInput & { hoursDone?: number }): Promise<FutureTask> {
  return toFutureTask(
    await request<FutureTaskWire>('/future-tasks', { method: 'POST', ...json(toFutureTaskBody(taskData)) })
  );
}

/** The API replaces the whole task, so partial updates are merged onto the current values. */
export async function updateFutureTask(
  id: string,
  updates: Partial<Omit<FutureTask, 'id' | 'userId' | 'createdAt'>>
): Promise<FutureTask> {
  const current = (await getFutureTasks()).find((t) => t.id === id);
  if (!current) throw new ApiError(404, 'Task not found');

  return toFutureTask(
    await request<FutureTaskWire>(`/future-tasks/${id}`, {
      method: 'PUT',
      ...json(toFutureTaskBody({ ...current, ...updates })),
    })
  );
}

export async function deleteFutureTask(id: string): Promise<boolean> {
  await request<void>(`/future-tasks/${id}`, { method: 'DELETE' });
  return true;
}

// -----------------------------------------------------------------------------
// Auth (/api/auth)
// -----------------------------------------------------------------------------

/** Returns the signed-in user. Fields the API does not provide yet are filled with defaults. */
export async function getCurrentUser(): Promise<User> {
  const info = await request<{ email: string }>('/auth/manage/info');
  return {
    id: '',
    email: info.email,
    name: info.email.split('@')[0],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Toronto',
    createdAt: '',
  };
}

/** Signs in with an HttpOnly session cookie. The token field is kept for compatibility. */
export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  await request<void>('/auth/login?useCookies=true', { method: 'POST', ...json({ email, password }) });
  return { user: await getCurrentUser(), token: '' };
}

/** Creates an account, then signs in. Name is not stored by the API yet. */
export async function register(
  email: string,
  password: string,
  _name?: string
): Promise<{ user: User; token: string }> {
  await request<void>('/auth/register', { method: 'POST', ...json({ email, password }) });
  return login(email, password);
}

export async function logout(): Promise<void> {
  await request<void>('/auth/logout', { method: 'POST' });
}
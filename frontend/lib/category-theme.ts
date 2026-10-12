import {
  Books,
  Briefcase,
  type IconComponent,
  Kettlebell,
  Kite,
  Pebbles,
  Sprout,
} from '@/components/icons';
import { DailyTaskItem, GoalCategory } from './types';

/**
 * Accent keys: one per goal category, plus "deadline" for tasks linked to a future task.
 * Each key maps to an .accent-* class in globals.css that sets the --accent variables.
 */
export type AccentKey = GoalCategory | 'deadline';

export const ACCENT_CLASS: Record<AccentKey, string> = {
  fitness: 'accent-fitness',
  career: 'accent-career',
  learning: 'accent-learning',
  health: 'accent-health',
  personal: 'accent-personal',
  other: 'accent-other',
  deadline: 'accent-deadline',
};

export const CATEGORY_META: Record<GoalCategory, { label: string; icon: IconComponent }> = {
  learning: { label: 'Learning', icon: Books },
  career: { label: 'Career', icon: Briefcase },
  fitness: { label: 'Fitness', icon: Kettlebell },
  health: { label: 'Health', icon: Sprout },
  personal: { label: 'Personal', icon: Kite },
  other: { label: 'Other', icon: Pebbles },
};

/**
 * Daily tasks only carry the linked goal's id, not its category,
 * so the caller passes a goalId -> category map built from getGoals().
 */
export function accentForTask(
  task: DailyTaskItem,
  goalCategories: Record<string, GoalCategory>
): AccentKey {
  const link = task.linkedTo;
  if (!link) return 'other';
  if (link.type === 'futureTask') return 'deadline';
  return goalCategories[link.id] ?? 'other';
}

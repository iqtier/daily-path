/**
 * Daily Path — Formatting & Time Utilities
 * Helper functions for stopwatch mm:ss formatting and comparison calculations.
 * Notice: No scheduled clock times (e.g. 9:00 AM) are used anywhere.
 */

/**
 * Format total seconds into a clean stopwatch display "mm:ss" (or "hh:mm:ss" if > 1 hour)
 */
export function formatStopwatch(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Convert seconds to rounded minutes for display (e.g., 1920s -> 32 min)
 */
export function secondsToMinutes(seconds: number): number {
  return Math.round(seconds / 60);
}

/**
 * Calculates comparison between actual user time and suggested time.
 * Returns minutes, label, and variant color ('faster' | 'longer' | 'exact'):
 * - "Right on time" if within 2 minutes (diff <= 2 and diff >= -2)
 * - "X min faster" (green) if faster (diff < -2)
 * - "X min longer" (orange) if slower (diff > 2)
 */
export function getDurationComparison(
  actualSeconds: number,
  suggestedMinutes: number
): {
  userMinutes: number;
  diffMinutes: number;
  label: string;
  variant: 'faster' | 'longer' | 'exact';
} {
  const userMinutes = secondsToMinutes(actualSeconds);
  const diffMinutes = userMinutes - suggestedMinutes;

  // Within 2 minutes counts as "Right on time"
  if (Math.abs(diffMinutes) <= 2) {
    return {
      userMinutes,
      diffMinutes,
      label: 'Right on time',
      variant: 'exact',
    };
  }

  // Faster than suggested by more than 2 minutes
  if (diffMinutes < -2) {
    const absDiff = Math.abs(diffMinutes);
    return {
      userMinutes,
      diffMinutes,
      label: `${absDiff} min faster`,
      variant: 'faster',
    };
  }

  // Slower than suggested by more than 2 minutes
  return {
    userMinutes,
    diffMinutes,
    label: `${diffMinutes} min longer`,
    variant: 'longer',
  };
}

/**
 * Friendly relative date display without clock times (e.g. "Today", "Due in 4 days")
 */
export function formatDueDateBadge(dueDateString: string): {
  text: string;
  isUrgent: boolean;
} {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDateString);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isUrgent: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isUrgent: true };
    }
    if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, isUrgent: diffDays <= 3 };
    }
    return { text: `Due ${dueDateString}`, isUrgent: false };
  } catch {
    return { text: dueDateString, isUrgent: false };
  }
}

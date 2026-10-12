/**
 * Confetti moments. canvas-confetti is loaded on demand so it stays out of the
 * initial bundle and never runs during server rendering.
 */

const PARTY_COLORS = ['#ffc24d', '#5fd9a3', '#7aa7ff', '#ff8fbc', '#b79bff'];

export interface BurstPoint {
  x: number;
  y: number;
  color: string;
}

/**
 * Read position and accent color from an element up front, because the element
 * (e.g. the Mark done button) may unmount before the save finishes.
 */
export function burstPointFrom(el: Element): BurstPoint {
  const r = el.getBoundingClientRect();
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
    color: getComputedStyle(el).getPropertyValue('--accent').trim() || '#8f84ff',
  };
}

/** Small pop when a single task is marked done. */
export async function celebrateTask(point: BurstPoint): Promise<void> {
  const { default: confetti } = await import('canvas-confetti');
  confetti({
    particleCount: 40,
    spread: 62,
    startVelocity: 26,
    scalar: 0.8,
    ticks: 130,
    origin: { x: point.x, y: point.y },
    colors: [point.color, ...PARTY_COLORS],
    disableForReducedMotion: true,
  });
}

/** Bigger two-sided burst for finishing the whole day. */
export async function celebrateDay(fromEl: Element): Promise<void> {
  const origin = burstPointFrom(fromEl);
  const { default: confetti } = await import('canvas-confetti');
  const fire = (x: number, angle: number) =>
    confetti({
      particleCount: 80,
      angle,
      spread: 70,
      startVelocity: 50,
      origin: { x, y: origin.y },
      colors: PARTY_COLORS,
      disableForReducedMotion: true,
    });
  fire(Math.max(0.05, origin.x - 0.15), 60);
  fire(Math.min(0.95, origin.x + 0.15), 120);
  window.setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 110,
      startVelocity: 38,
      origin: { x: origin.x, y: origin.y },
      colors: PARTY_COLORS,
      disableForReducedMotion: true,
    });
  }, 280);
}

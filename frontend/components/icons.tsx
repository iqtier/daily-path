import React from 'react';

/**
 * Daily Path's own icon set, built around the trail metaphor.
 * Drawn on a 24px grid with a 2px round stroke so they sit alongside the
 * standard utility glyphs (check, lock, pencil) without looking out of place.
 */

export type IconProps = React.SVGProps<SVGSVGElement>;
export type IconComponent = React.ComponentType<{ className?: string }>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Brand mark: a road narrowing toward the horizon. */
export function TrailMark(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 21c3.5-4.5 5-10 7-17.5M20.5 21c-3.5-4.5-5-10-7-17.5" />
      <path d="M12 19.5v-2.5M12 13v-2M12 7.2V6" />
    </Svg>
  );
}

/** Today: stepping stones, the current one filled. */
export function SteppingStones(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="6" cy="18.5" rx="3.25" ry="2.25" />
      <ellipse cx="12" cy="12.5" rx="3.25" ry="2.25" />
      <ellipse cx="18" cy="6.5" rx="3.25" ry="2.25" fill="currentColor" />
    </Svg>
  );
}

/** Goals: a peak with a flag on top. */
export function Summit(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 20.5 10 9l3.2 4.8 2-2.8 6.3 9.5Z" />
      <path d="M10 9V3.2l4.2 1.6L10 6.4" />
    </Svg>
  );
}

/** Future tasks: a signpost pointing ahead. */
export function Signpost(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 22V2.5" />
      <path d="M5 5.5h10.5L18 7.75 15.5 10H5Z" />
      <path d="M19 12.5H8.5L6 14.75 8.5 17H19Z" />
    </Svg>
  );
}

/** Progress count: a cairn, the stacked stones hikers leave to mark a trail. */
export function Cairn(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="12" cy="18.75" rx="7.5" ry="2.75" />
      <ellipse cx="12" cy="12.75" rx="5.25" ry="2.5" />
      <ellipse cx="12" cy="7.25" rx="3.25" ry="2.1" />
    </Svg>
  );
}

/** Bonus time: a stopwatch with a plus. */
export function StopwatchPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="14" r="7.5" />
      <path d="M10 2.5h4M12 2.5v4M18.5 6.5l1.5-1.5M12 11v6M9 14h6" />
    </Svg>
  );
}

/** Building a plan: a dotted trail being laid down. */
export function DottedTrail(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20c4-1.5 3.5-7.5 8-8s4-6.5 8-8" strokeDasharray="0.01 3.6" strokeWidth={2.4} />
      <circle cx="4" cy="20" r="1.75" fill="currentColor" stroke="none" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Goal categories
// ---------------------------------------------------------------------------

export function Books(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="4" width="4.5" height="16" rx="1" />
      <rect x="8" y="6.5" width="4.5" height="13.5" rx="1" />
      <path d="m14.2 7.4 4-1.1 3.3 12.3-4 1.1Z" />
      <path d="M3.5 8h4.5M8 10.5h4.5" />
    </Svg>
  );
}

export function Briefcase(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18M11 12.5v1.5h2v-1.5" />
    </Svg>
  );
}

export function Kettlebell(props: IconProps) {
  return (
    <Svg {...props}>
      {/* Wide handle and flat base keep it from reading as a padlock. */}
      <path d="M7.6 10.2 6.9 6.3A1.6 1.6 0 0 1 8.5 4.5h7a1.6 1.6 0 0 1 1.6 1.8l-.7 3.9" />
      <path d="M5.5 15a6.5 6.5 0 0 1 13 0c0 2.1-.9 3.8-2.1 5H7.6c-1.2-1.2-2.1-2.9-2.1-5Z" />
    </Svg>
  );
}

export function Sprout(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21v-8.5" />
      <path d="M12 12.5c0-4.2 3-6.5 7.5-6.5 0 4.2-3 6.5-7.5 6.5Z" />
      <path d="M12 15c0-3.3-2.3-5.3-6.5-5.3 0 3.3 2.3 5.3 6.5 5.3Z" />
    </Svg>
  );
}

export function Kite(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 2.5 18 9l-6 8.5L6 9Z" />
      <path d="M6 9h12M12 2.5v15" />
      <path d="M12 17.5c-1.5 1.2 1.5 2.3 0 4" />
    </Svg>
  );
}

export function Pebbles(props: IconProps) {
  return (
    <Svg {...props}>
      <ellipse cx="7.5" cy="8" rx="3" ry="2.6" />
      <ellipse cx="16.5" cy="7" rx="2.6" ry="2.2" />
      <ellipse cx="9" cy="16.5" rx="3.6" ry="3" />
      <ellipse cx="17.5" cy="16" rx="2.4" ry="2.1" />
    </Svg>
  );
}

'use client';

import { MotionConfig } from 'motion/react';

/** App-wide client providers. MotionConfig makes every Motion animation honor prefers-reduced-motion. */
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

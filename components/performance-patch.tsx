'use client';

import { useEffect } from 'react';

export function PerformancePatch() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.performance?.measure) return;

    const original = performance.measure.bind(performance);
    performance.measure = function (...args) {
      try {
        return original(...args);
      } catch {
        // Turbopack sometimes calls performance.measure with stale/cleared marks
        // that produce negative timestamps — silently ignore.
        return {
          detail: null,
          duration: 0,
          entryType: 'measure' as const,
          name: '',
          startTime: 0,
          toJSON: () => ({}),
        } as PerformanceMeasure;
      }
    };
  }, []);

  return null;
}

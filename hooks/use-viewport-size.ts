import { useSyncExternalStore } from "react";

interface ViewportSize {
  width: number;
  height: number;
}

// Cached snapshot so getSnapshot returns a stable reference until the
// viewport actually changes (useSyncExternalStore compares with Object.is).
let cached: ViewportSize = { width: 0, height: 0 };
const SERVER_SNAPSHOT: ViewportSize = { width: 0, height: 0 };

function subscribe(callback: () => void) {
  window.addEventListener("resize", callback);
  return () => window.removeEventListener("resize", callback);
}

function getSnapshot(): ViewportSize {
  if (cached.width !== window.innerWidth || cached.height !== window.innerHeight) {
    cached = { width: window.innerWidth, height: window.innerHeight };
  }
  return cached;
}

function getServerSnapshot(): ViewportSize {
  return SERVER_SNAPSHOT;
}

export function useViewportSize(): ViewportSize {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

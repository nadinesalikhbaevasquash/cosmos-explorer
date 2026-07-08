"use client";

import { useSyncExternalStore } from "react";
import { subscribe, getSnapshot, getServerSnapshot } from "./storage";
import type { Trip } from "./types";

/**
 * Reactive list of saved trips. Re-renders automatically whenever a trip is
 * created, updated, or deleted (including from another browser tab).
 * Returns an empty array during SSR / first paint to avoid hydration mismatch.
 */
export function useTrips(): Trip[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

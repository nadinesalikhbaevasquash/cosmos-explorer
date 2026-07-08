// Trip storage service — the single source of truth for persistence.
// Backed by localStorage; all access goes through this module so the rest
// of the app never touches the storage key or JSON directly.

import type { PlanInput, Trip } from "./types";
import { generatePlan } from "./planner";

const STORAGE_KEY = "travel-planner.trips.v1";

const isBrowser = () => typeof window !== "undefined";

function readAll(): Trip[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Trip[]) : [];
  } catch {
    // Corrupt / unreadable storage shouldn't crash the app.
    return [];
  }
}

function writeAll(trips: Trip[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  emit();
}

// ── Reactive store plumbing (for useSyncExternalStore) ──────────────────
// A cached snapshot keeps getSnapshot() referentially stable between
// mutations, which useSyncExternalStore requires.
const EMPTY: Trip[] = [];
let cache: Trip[] | null = null;
const listeners = new Set<() => void>();

function loadSnapshot(): Trip[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

function emit(): void {
  cache = loadSnapshot();
  listeners.forEach((l) => l());
}

export function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keep other tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) emit();
  };
  if (isBrowser()) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    if (isBrowser()) window.removeEventListener("storage", onStorage);
  };
}

export function getSnapshot(): Trip[] {
  if (cache === null) cache = loadSnapshot();
  return cache;
}

export function getServerSnapshot(): Trip[] {
  return EMPTY;
}

function makeId(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultName(input: PlanInput): string {
  return input.to.trim() ? `${input.from.trim()} → ${input.to.trim()}` : "Untitled trip";
}

// ── Public API ──────────────────────────────────────────────────────────

/** All saved trips, newest first. */
export function listTrips(): Trip[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getTrip(id: string): Trip | undefined {
  return readAll().find((t) => t.id === id);
}

/** Create a new trip from planner input (regenerates the plan). */
export function createTrip(input: PlanInput, name?: string): Trip {
  const result = generatePlan(input);
  if (!result.ok) throw new Error(result.error);

  const now = Date.now();
  const trip: Trip = {
    id: makeId(),
    name: name?.trim() || defaultName(input),
    input,
    plan: result.plan,
    createdAt: now,
    updatedAt: now,
  };

  writeAll([trip, ...readAll()]);
  return trip;
}

/** Update an existing trip's input (plan is regenerated to stay in sync). */
export function updateTrip(id: string, input: PlanInput, name?: string): Trip {
  const result = generatePlan(input);
  if (!result.ok) throw new Error(result.error);

  const trips = readAll();
  const idx = trips.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error("Trip not found.");

  const updated: Trip = {
    ...trips[idx],
    name: name?.trim() || defaultName(input),
    input,
    plan: result.plan,
    updatedAt: Date.now(),
  };
  trips[idx] = updated;
  writeAll(trips);
  return updated;
}

export function deleteTrip(id: string): void {
  writeAll(readAll().filter((t) => t.id !== id));
}

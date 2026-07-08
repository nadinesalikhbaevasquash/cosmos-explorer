// Shared logic for the daily quiz: local-date handling, deterministic
// day-seeded shuffling (same 5 questions for everyone on a given day),
// and streak state persisted in localStorage.

export type QuizState = {
  lastDate: string;    // YYYY-MM-DD (local) of the last completed quiz
  lastScore: number;
  lastSquares: string; // e.g. "🟩🟩🟥🟩🟩"
  streak: number;
  best: number;
  played: number;
};

const KEY = "astranova-quiz";

export function localDateStr(d = new Date()): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export function dayNumber(dateStr: string): number {
  return Math.floor(Date.parse(dateStr) / 86400000);
}

// Quiz #1 = 1 July 2026.
const EPOCH = dayNumber("2026-07-01");

export function quizNumber(dateStr: string): number {
  return dayNumber(dateStr) - EPOCH + 1;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded Fisher–Yates: shuffle 0..total-1 and take the first `count`. */
export function seededPick(count: number, total: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const idx = Array.from({ length: total }, (_, i) => i);
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, count);
}

export function loadQuizState(): QuizState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as QuizState) : null;
  } catch {
    return null;
  }
}

export function saveQuizState(s: QuizState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // storage unavailable (private mode) — quiz still playable, streak just won't persist
  }
}

/** Streak as it should be displayed today: alive if last play was today or yesterday.
 *  Guards against a negative gap (device clock rolled back / timezone travel), which
 *  would otherwise show a stale streak instead of resetting it to 0. */
export function visibleStreak(s: QuizState | null, today: string): number {
  if (!s) return 0;
  const gap = dayNumber(today) - dayNumber(s.lastDate);
  return gap >= 0 && gap <= 1 ? s.streak : 0;
}

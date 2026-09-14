/**
 * Pushing local progress up to the account.
 *
 * The site is built local-first on purpose: the learning path and the quiz write to
 * localStorage whether or not anyone is signed in, so nothing requires an account
 * and nothing breaks without one. This is the one-way lift from there to the server.
 *
 * Fire-and-forget by design. If the request fails the local copy is still correct
 * and the next completed stop will carry everything up anyway, so there is nothing
 * to retry and no reason to make the user wait on a network round trip to tick a
 * checkbox.
 */

export type QuizProgress = {
  streak: number;
  lastDate: string | null;
  lastScore: number;
  lastSquares: string;
} | null;

export function syncProgress(progress: {
  pathDone?: string[];
  quiz?: QuizProgress;
}): void {
  if (typeof window === "undefined") return;
  void fetch("/api/auth/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
    keepalive: true, // survives the tab being closed right after
  }).catch(() => {
    /* Signed out, offline, or the endpoint is down. Local state is unaffected. */
  });
}

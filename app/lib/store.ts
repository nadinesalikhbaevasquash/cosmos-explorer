import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getStore } from "@netlify/blobs";

/**
 * The user store.
 *
 * Same two-backend shape Crossfire uses, for the same reason: Netlify Blobs in
 * production because a serverless function's filesystem is ephemeral and anything
 * written to it is gone on the next deploy, and a JSON file locally so `next dev`
 * works with no setup and no credentials.
 *
 * What an account is actually *for* here is the last two fields. AstraNova has
 * nothing to gate: every page is public. Accounts exist so the learning path and
 * the quiz streak stop living in one browser's localStorage and start following you
 * between your phone and your laptop.
 */

const DATA_DIR = process.env.ASTRANOVA_DATA_DIR || path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DATA_DIR, "astranova-users.json");

const BLOB_STORE = "astranova";
const BLOB_KEY = "users.json";

/**
 * The users blob, or null when we aren't running on Netlify.
 *
 * Detection is by trying, not by checking an env var: `NETLIFY` is only set during
 * the *build*, never in the function runtime, and the runtime credentials are
 * injected per request onto globalThis. So this has to be evaluated per call rather
 * than once at import, and `getStore` throws when it cannot find them.
 *
 * "strong" consistency because every write is a read-modify-write of one blob;
 * eventual consistency would silently drop concurrent signups.
 */
function usersBlob() {
  try {
    return getStore(BLOB_STORE, { consistency: "strong" });
  } catch {
    return null; // local `next dev`
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  /** Learning-path stop ids the user has completed. */
  pathDone: string[];
  /** Daily-quiz streak state, mirroring the shape used in app/lib/quiz.ts. */
  quiz: {
    streak: number;
    lastDate: string | null;
    lastScore: number;
    lastSquares: string;
  } | null;
}

/** Everything about a user that is safe to send to the browser. */
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(u: User): PublicUser {
  const { passwordHash: _ignored, ...rest } = u;
  return rest;
}

/* ------------------------------ persistence ----------------------------- */

async function readUsers(): Promise<User[]> {
  const blob = usersBlob();
  if (blob) {
    const raw = await blob.get(BLOB_KEY, { type: "json" });
    return Array.isArray(raw) ? (raw as User[]) : [];
  }
  try {
    return JSON.parse(await fs.readFile(USERS_FILE, "utf8")) as User[];
  } catch {
    return []; // first run, no file yet
  }
}

async function writeUsers(users: User[]): Promise<void> {
  const blob = usersBlob();
  if (blob) {
    await blob.setJSON(BLOB_KEY, users);
    return;
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

/* -------------------------------- queries ------------------------------- */

/** Email comparison is always case-insensitive; nobody types their own address
 *  the same way twice. */
const norm = (email: string) => email.trim().toLowerCase();

export async function findUserByEmail(email: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => norm(u.email) === norm(email)) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const users = await readUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  const users = await readUsers();
  const user: User = {
    id: randomUUID(),
    name: input.name.trim(),
    email: norm(input.email),
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString(),
    pathDone: [],
    quiz: null,
  };
  users.push(user);
  await writeUsers(users);
  return user;
}

/**
 * Merge progress into a user.
 *
 * Read-modify-write of the whole list, which is fine at this scale and matches how
 * the blob is stored. Progress is merged rather than replaced so that signing in on
 * a second device cannot wipe what the first one recorded: path stops union, and the
 * higher streak wins.
 */
export async function saveProgress(
  id: string,
  progress: { pathDone?: string[]; quiz?: User["quiz"] },
): Promise<PublicUser | null> {
  const users = await readUsers();
  const i = users.findIndex((u) => u.id === id);
  if (i === -1) return null;

  const current = users[i];

  if (progress.pathDone) {
    current.pathDone = [...new Set([...current.pathDone, ...progress.pathDone])];
  }
  if (progress.quiz) {
    const incoming = progress.quiz;
    const existing = current.quiz;
    current.quiz =
      !existing || incoming.streak >= existing.streak ? incoming : existing;
  }

  users[i] = current;
  await writeUsers(users);
  return toPublicUser(current);
}

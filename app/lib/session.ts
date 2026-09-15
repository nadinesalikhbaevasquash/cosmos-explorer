import {
  scrypt as scryptCb,
  randomBytes,
  timingSafeEqual,
  createHmac,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getUserById, toPublicUser, type PublicUser } from "./store";

const scrypt = promisify(scryptCb);

/**
 * Passwords and sessions, with no dependencies beyond Node's own crypto.
 *
 * Ported from Crossfire, which has been running this in production. Two decisions
 * worth keeping visible:
 *
 *   scrypt, not SHA  A password hash is supposed to be slow. SHA-256 is fast by
 *                    design, which is exactly wrong here: it makes a stolen list
 *                    cheap to brute-force. scrypt is deliberately expensive in both
 *                    CPU and memory, with a per-user salt so one rainbow table
 *                    cannot attack two accounts.
 *
 *   stateless token  The session cookie carries a signed payload rather than an
 *                    opaque id pointing at a server-side table. No session store to
 *                    read on every request, which matters when the store is a blob.
 *                    The trade is that a session cannot be revoked early; for a site
 *                    with nothing to gate, that is an acceptable price.
 */

export const SESSION_COOKIE = "astranova_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

/**
 * HMAC secret for signing session tokens.
 *
 * Set ASTRANOVA_SECRET in production. The dev fallback keeps local development
 * working with no .env file; it is not a secret and is not meant to be one.
 */
const SECRET =
  process.env.ASTRANOVA_SECRET ?? "astranova-dev-secret-change-me-in-production";

/* ------------------------------ passwords ------------------------------ */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  // Compare in constant time, and only when the lengths already match —
  // timingSafeEqual throws on a length mismatch, which would itself leak.
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}

/* ------------------------- reset & verify tokens ----------------------- */

/**
 * How long a reset link stays good. Short on purpose: it sits in an inbox, and an
 * inbox is not a safe place to leave a key to an account lying around.
 */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Much longer. Confirming an address is not security-critical, and signup mail
 * routinely gets opened the next morning.
 */
export const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** How long before the same address can trigger another email. Stops the form
 *  being used to flood somebody's inbox. */
export const RESEND_COOLDOWN_MS = 60 * 1000;

/** The secret that goes in the email: 256 bits of randomness, URL-safe.
 *  Named for its job so it cannot be confused with the session token below. */
export function createEmailToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * What gets stored. Only the hash is persisted, so the user store on its own
 * cannot be used to reset anyone's password — the secret half exists only in the
 * email. A plain SHA-256 is right here, unlike for passwords: the input is already
 * 256 bits of entropy, so there is nothing to brute-force and nothing to salt.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* --------------------------- session tokens ---------------------------- */

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function createSessionToken(userId: string): string {
  const body = JSON.stringify({
    uid: userId,
    exp: Date.now() + SESSION_MAX_AGE * 1000,
  });
  const payload = Buffer.from(body).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string | undefined): { uid: string } | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const { uid, exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString(),
    );
    if (typeof uid !== "string" || typeof exp !== "number") return null;
    if (Date.now() > exp) return null;
    return { uid };
  } catch {
    return null;
  }
}

/* ------------------------------ cookie API ----------------------------- */

export async function startSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true, // JavaScript must never be able to read this
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/** The signed-in user, or null. Safe to call from any server context. */
export async function getSessionUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const parsed = readToken(jar.get(SESSION_COOKIE)?.value);
  if (!parsed) return null;
  const user = await getUserById(parsed.uid);
  return user ? toPublicUser(user) : null;
}

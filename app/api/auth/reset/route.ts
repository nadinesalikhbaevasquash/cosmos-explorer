import { NextResponse } from "next/server";
import { findUserByTokenHash, patchUser, toPublicUser } from "@/app/lib/store";
import { hashPassword, hashToken, startSession } from "@/app/lib/session";

/**
 * Finish a password reset.
 *
 * The token is single-use: it is cleared in the same write that sets the new
 * password, so a link forwarded to someone else, or replayed from a mailbox later,
 * does nothing.
 */
export async function POST(request: Request) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  const user = await findUserByTokenHash("resetTokenHash", hashToken(token));

  // One message for a bad token and an expired one. Telling them apart would
  // confirm that a token was once real.
  const bad = NextResponse.json(
    { error: "This link has expired or has already been used. Ask for a new one." },
    { status: 400 },
  );

  if (!user) return bad;
  if (!user.resetExpiresAt || Date.parse(user.resetExpiresAt) < Date.now()) return bad;

  const updated = await patchUser(user.id, {
    passwordHash: await hashPassword(password),
    resetTokenHash: null,
    resetExpiresAt: null,
    // Reaching the inbox proves the address works, so stop asking them to confirm it.
    emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
  });
  if (!updated) return bad;

  // Sign them straight in. They have just proved they own the inbox and chosen a
  // password; making them type it again immediately is friction for its own sake.
  await startSession(updated.id);
  return NextResponse.json({ user: toPublicUser(updated) });
}

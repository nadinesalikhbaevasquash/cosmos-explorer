import { NextResponse } from "next/server";
import { findUserByEmail, toPublicUser } from "@/app/lib/store";
import { startSession, verifyPassword } from "@/app/lib/session";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  const user = await findUserByEmail(email);

  /* One message for "no such account" and "wrong password", because telling them
     apart hands an attacker a way to discover which addresses are registered. This
     is the one place vagueness is the right call. */
  const failed = NextResponse.json(
    { error: "Email or password is incorrect." },
    { status: 401 },
  );

  if (!user) return failed;
  if (!(await verifyPassword(password, user.passwordHash))) return failed;

  await startSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}

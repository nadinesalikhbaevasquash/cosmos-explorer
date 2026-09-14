import { NextResponse } from "next/server";
import { createUser, findUserByEmail, toPublicUser } from "@/app/lib/store";
import { hashPassword, startSession } from "@/app/lib/session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create an account.
 *
 * Deliberately minimal: a name, an email and a password. No email verification yet,
 * because nothing here is worth protecting and an unverified address costs nothing.
 * That changes the day Resend is wired up and the site starts sending mail.
 */
export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  if (await findUserByEmail(email)) {
    // Said plainly on purpose. Hiding it protects nothing on a site with no private
    // data, and "something went wrong" would just make people try the same thing again.
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const user = await createUser({
    name,
    email,
    passwordHash: await hashPassword(password),
  });

  await startSession(user.id);
  return NextResponse.json({ user: toPublicUser(user) });
}

import { NextResponse } from "next/server";
import { createUser, findUserByEmail, patchUser, toPublicUser } from "@/app/lib/store";
import {
  createEmailToken,
  hashPassword,
  hashToken,
  startSession,
  VERIFY_TOKEN_TTL_MS,
} from "@/app/lib/session";
import { sendMail, siteOrigin } from "@/app/lib/email";
import { normaliseLang, verifyEmail } from "@/app/lib/mail-copy";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create an account.
 *
 * Deliberately minimal: a name, an email and a password. Nothing is gated on the
 * address being confirmed, because nothing on this site is worth gating — but the
 * confirmation mail goes out anyway, so that a forgotten password later has
 * somewhere to be sent.
 */
export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string; lang?: string };
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

  /* Confirmation mail, best-effort and deliberately not awaited for its result.
     A Resend outage must not turn a successful signup into an error: the account
     exists, the session is live, and the profile page can offer to send it again. */
  const lang = normaliseLang(body.lang);
  const token = createEmailToken();
  void patchUser(user.id, {
    verifyTokenHash: hashToken(token),
    verifyExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
    verifyRequestedAt: new Date().toISOString(),
  }).then(() =>
    sendMail({
      to: user.email,
      ...verifyEmail(lang, `${siteOrigin(request)}/api/auth/verify?token=${token}&lang=${lang}`),
    }),
  );

  return NextResponse.json({ user: toPublicUser(user) });
}

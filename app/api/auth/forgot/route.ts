import { NextResponse } from "next/server";
import { findUserByEmail, patchUser } from "@/app/lib/store";
import {
  createEmailToken,
  hashToken,
  RESET_TOKEN_TTL_MS,
  RESEND_COOLDOWN_MS,
} from "@/app/lib/session";
import { sendMail, siteOrigin } from "@/app/lib/email";
import { normaliseLang, resetEmail } from "@/app/lib/mail-copy";

/**
 * Start a password reset.
 *
 * Always answers 200, whatever happens. An honest "no account with that email"
 * would turn this endpoint into a tool for discovering who is registered, and the
 * reassurance is worth nothing next to that. The person who owns the address finds
 * out by receiving the mail; nobody else learns anything.
 */
export async function POST(request: Request) {
  const ok = NextResponse.json({ ok: true });

  let body: { email?: string; lang?: string };
  try {
    body = await request.json();
  } catch {
    return ok;
  }

  const email = (body.email ?? "").trim();
  if (!email) return ok;

  const user = await findUserByEmail(email);
  if (!user) return ok;

  // Don't let the form be used to flood somebody's inbox.
  if (
    user.resetRequestedAt &&
    Date.now() - Date.parse(user.resetRequestedAt) < RESEND_COOLDOWN_MS
  ) {
    return ok;
  }

  const token = createEmailToken();
  await patchUser(user.id, {
    resetTokenHash: hashToken(token),
    resetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
    resetRequestedAt: new Date().toISOString(),
  });

  const lang = normaliseLang(body.lang);
  const link = `${siteOrigin(request)}/${lang}/reset?token=${token}`;
  const mail = resetEmail(lang, link);

  await sendMail({ to: user.email, ...mail });
  return ok;
}

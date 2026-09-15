import { NextResponse } from "next/server";
import { getUserById, patchUser } from "@/app/lib/store";
import { getSessionUser, createEmailToken, hashToken, VERIFY_TOKEN_TTL_MS, RESEND_COOLDOWN_MS } from "@/app/lib/session";
import { sendMail, siteOrigin } from "@/app/lib/email";
import { normaliseLang, verifyEmail } from "@/app/lib/mail-copy";

/** Send the confirmation email again, for the signed-in user only. */
export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const user = await getUserById(me.id);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (user.emailVerifiedAt) return NextResponse.json({ ok: true, already: true });

  if (
    user.verifyRequestedAt &&
    Date.now() - Date.parse(user.verifyRequestedAt) < RESEND_COOLDOWN_MS
  ) {
    return NextResponse.json({ ok: true, throttled: true });
  }

  let lang = "en";
  try {
    lang = normaliseLang(((await request.json()) as { lang?: string }).lang);
  } catch {
    /* no body is fine; default to English */
  }

  const token = createEmailToken();
  await patchUser(user.id, {
    verifyTokenHash: hashToken(token),
    verifyExpiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
    verifyRequestedAt: new Date().toISOString(),
  });

  const link = `${siteOrigin(request)}/api/auth/verify?token=${token}&lang=${lang}`;
  await sendMail({ to: user.email, ...verifyEmail(normaliseLang(lang), link) });

  return NextResponse.json({ ok: true });
}

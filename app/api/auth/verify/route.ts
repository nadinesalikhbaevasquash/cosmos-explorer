import { NextResponse } from "next/server";
import { findUserByTokenHash, patchUser } from "@/app/lib/store";
import { hashToken } from "@/app/lib/session";

/**
 * Confirm an email address.
 *
 * A GET because it is reached by clicking a link in an email, and redirects rather
 * than returning JSON for the same reason: whatever happens, the person ends up
 * looking at a page instead of a wall of braces.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  const lang = ["en", "ru", "uz"].includes(url.searchParams.get("lang") ?? "")
    ? url.searchParams.get("lang")
    : "en";

  const done = (state: "ok" | "bad") =>
    NextResponse.redirect(new URL(`/${lang}/verify?state=${state}`, url.origin));

  const user = await findUserByTokenHash("verifyTokenHash", hashToken(token));
  if (!user) return done("bad");
  if (!user.verifyExpiresAt || Date.parse(user.verifyExpiresAt) < Date.now()) {
    return done("bad");
  }

  await patchUser(user.id, {
    emailVerifiedAt: new Date().toISOString(),
    verifyTokenHash: null,
    verifyExpiresAt: null,
  });

  return done("ok");
}

import { NextResponse } from "next/server";
import { saveProgress } from "@/app/lib/store";
import { getSessionUser } from "@/app/lib/session";

/**
 * Push local progress up to the account.
 *
 * The entire reason accounts exist here. The learning path and quiz streak are still
 * written to localStorage first, so the site works signed out exactly as it does
 * today; this syncs that state up whenever someone is signed in.
 *
 * The store merges rather than overwrites, so opening the site on a second device
 * cannot wipe what the first one recorded.
 */
export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let body: { pathDone?: string[]; quiz?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const user = await saveProgress(me.id, {
    pathDone: Array.isArray(body.pathDone) ? body.pathDone.filter((s) => typeof s === "string") : undefined,
    quiz: (body.quiz as never) ?? undefined,
  });

  return NextResponse.json({ user });
}

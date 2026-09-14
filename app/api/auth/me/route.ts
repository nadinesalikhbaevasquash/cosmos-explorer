import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/session";

/** Who is signed in, or null. The client calls this once on mount. */
export async function GET() {
  return NextResponse.json({ user: await getSessionUser() });
}

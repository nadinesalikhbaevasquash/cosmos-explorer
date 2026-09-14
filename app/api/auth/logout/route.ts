import { NextResponse } from "next/server";
import { endSession } from "@/app/lib/session";

export async function POST() {
  await endSession();
  return NextResponse.json({ ok: true });
}

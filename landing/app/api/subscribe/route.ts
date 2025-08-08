import { NextRequest, NextResponse } from "next/server";
import { safeQuery } from "../../../lib/safeQuery";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = typeof body.email === "string" ? body.email : "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  await safeQuery("INSERT INTO subscribers (email) VALUES ($1)", [email]);
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const INTAKE_SECRET = process.env.INTAKE_SECRET ?? "";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${ENGINE_URL}/intake`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-intake-secret": INTAKE_SECRET,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Engine unavailable" }, { status: 503 });
  }
}

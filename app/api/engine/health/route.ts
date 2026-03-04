import { NextResponse } from "next/server";

export async function GET() {
  try {
    const resp = await fetch(`${process.env.ENGINE_URL}/health`, {
      next: { revalidate: 0 },
    });
    if (!resp.ok) return NextResponse.json({ status: "down" }, { status: 502 });
    const data = await resp.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: "down" }, { status: 502 });
  }
}

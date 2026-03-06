// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSchool, findSchoolByEmail } from "@/lib/auth-db";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();
  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (findSchoolByEmail(email)) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }
  const school = createSchool(name, email, password);
  return NextResponse.json({ id: school.id, name: school.name });
}

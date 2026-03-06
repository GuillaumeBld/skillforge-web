// middleware.ts
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!login|register|api/auth|_next|favicon).*)"],
};

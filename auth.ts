// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findSchoolByEmail, verifyPassword } from "@/lib/auth-db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const school = findSchoolByEmail(credentials.email as string);
        if (!school) return null;
        if (!verifyPassword(credentials.password as string, school.password_hash)) return null;
        return { id: school.id, name: school.name, email: school.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
});

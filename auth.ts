// auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findSchoolByEmail, verifyPassword } from "@/lib/auth-db";

// AUTH_SECRET must be set in .env.local (run: openssl rand -base64 32)
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const school = findSchoolByEmail(credentials.email as string);
        // Always run bcrypt to prevent user enumeration via timing
        const hash = school?.password_hash ?? "$2b$12$buPSR.HyzaAzMH48.rkxb.vogSv7d/6S6GTcGm73T4kTXf3B6GHnW";
        const valid = verifyPassword(credentials.password as string, hash);
        if (!school || !valid) return null;
        return { id: school.id, name: school.name, email: school.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});

// app/login/page.tsx
"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password.");
    } else {
      router.push("/");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm space-y-5">
        <h1 className="text-xl font-extrabold text-gray-900">Sign in to SkillForge</h1>
        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
          <input name="email" type="email" required
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A]" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
          <input name="password" type="password" required
            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]/30 focus:border-[#1B4F8A]" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-[#1B4F8A] hover:bg-[#163E6E] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors">
          {loading ? "Signing in…" : "Sign in →"}
        </button>
        <p className="text-xs text-center text-gray-400">
          New school? <a href="/register" className="text-[#1B4F8A] font-medium">Register</a>
        </p>
      </form>
    </main>
  );
}

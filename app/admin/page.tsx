// app/admin/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";

async function getIntakeRecords(schoolId: string) {
  const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
  const INTAKE_SECRET = process.env.INTAKE_SECRET ?? "";
  try {
    const res = await fetch(`${ENGINE_URL}/intake/${schoolId}`, {
      cache: "no-store",
      headers: { "x-intake-secret": INTAKE_SECRET },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.records as Array<{
      id: string;
      worker_title: string;
      source_noc: string;
      matched_noc: string;
      matched_title: string;
      composite_score: number;
      funding_eligible: number;
      province: string;
      created_at: string;
    }>;
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const schoolId = session.user.id;
  if (!schoolId) redirect("/login");
  const records = await getIntakeRecords(schoolId);
  const total = records.length;
  const fundingCount = records.filter(r => r.funding_eligible === 1).length;
  const topTrades = Object.entries(
    records.reduce((acc, r) => {
      acc[r.matched_title] = (acc[r.matched_title] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Intake Dashboard</h1>
      <p className="text-gray-400 text-sm mb-8">{session.user.name}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total intakes", value: total },
          { label: "LMDA/WDA eligible", value: fundingCount },
          { label: "Eligibility rate", value: total ? `${Math.round(fundingCount / total * 100)}%` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-2xl font-extrabold text-[#1B4F8A]">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Top matched trades */}
      {topTrades.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide mb-3">Top matched trades</h2>
          <div className="space-y-2">
            {topTrades.map(([title, count]) => (
              <div key={title} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{title}</span>
                <span className="font-semibold text-[#1B4F8A]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intake log */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-extrabold text-gray-500 uppercase tracking-wide">Intake log</h2>
        </div>
        {records.length === 0 ? (
          <p className="text-sm text-gray-400 p-5">No intakes yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold">Worker title</th>
                <th className="text-left px-5 py-3 font-semibold">Matched trade</th>
                <th className="text-left px-5 py-3 font-semibold">Score</th>
                <th className="text-left px-5 py-3 font-semibold">LMDA</th>
                <th className="text-left px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-700">{r.worker_title}</td>
                  <td className="px-5 py-3 text-gray-700">{r.matched_title}</td>
                  <td className="px-5 py-3 font-semibold text-[#1B4F8A]">{Math.round(r.composite_score * 100)}</td>
                  <td className="px-5 py-3">
                    {r.funding_eligible === 1
                      ? <span className="text-[#1A7A4A] font-semibold">✓</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-400">{r.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

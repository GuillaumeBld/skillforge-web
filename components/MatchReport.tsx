// components/MatchReport.tsx
"use client";
import type { MatchResultItem, IntakeFormData } from "@/types/skillforge";

interface Props {
  sourceTitle: string;
  sourceNoc: string;
  matches: MatchResultItem[];
  form: IntakeFormData;
  onSelect: (match: MatchResultItem) => void;
  onBack: () => void;
}

function CircularScore({ score }: { score: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex-shrink-0 w-20 h-20">
      <svg width="80" height="80" className="-rotate-90 absolute inset-0">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E5E7EB" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="#1B4F8A" strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-[#1B4F8A] leading-none">{score}</span>
        <span className="text-[9px] text-gray-400 leading-none mt-0.5">match</span>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-[#1A7A4A]" : pct >= 50 ? "bg-amber-400" : "bg-gray-300";
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700">{pct}%</span>
      </div>
      <div className="bg-gray-100 rounded-full h-2.5">
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function DemandBadge({ score }: { score: number }) {
  if (score >= 0.70) return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-green-50 text-[#1A7A4A] border border-green-200">
      <span aria-hidden="true">↑</span> High demand
    </span>
  );
  if (score >= 0.50) return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <span aria-hidden="true">→</span> Moderate demand
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-gray-100 text-gray-500 border border-gray-200">
      <span aria-hidden="true">↓</span> Lower demand
    </span>
  );
}

const TEER_LABEL: Record<number, string> = {
  0: "Management", 1: "University/college", 2: "College/apprenticeship",
  3: "College/training", 4: "High school", 5: "Short demo",
};

export function MatchReport({ sourceTitle, sourceNoc, matches, form, onSelect, onBack }: Props) {
  return (
    <div className="max-w-2xl mx-auto p-8">
      <button
        onClick={onBack}
        className="text-sm text-[#1B4F8A] hover:text-[#163E6E] mb-6 flex items-center gap-1 font-medium transition-colors"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Trade Pathways</h1>
      <p className="text-gray-400 text-sm mb-7">
        {sourceTitle} (NOC {sourceNoc}) · {form.province} · {form.yearsExperience}yr experience
      </p>

      <div className="space-y-4">
        {matches.map((m, i) => (
          <div
            key={m.noc_code}
            className="bg-white rounded-xl border-l-4 border-l-[#1B4F8A] border border-gray-100 p-5 hover:shadow-md transition-shadow"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-gray-300">#{i + 1}</span>
                  <span className="font-extrabold text-gray-900 truncate">{m.title}</span>
                </div>
                <p className="text-xs text-gray-400">
                  NOC {m.noc_code} · TEER {m.teer} · {TEER_LABEL[m.teer] ?? "Trade"} training
                </p>
              </div>
              <CircularScore score={Math.round(m.composite_score * 100)} />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <ScoreBar label="Skill transfer" value={m.skill_similarity} />
              <ScoreBar label="Market demand" value={m.demand_score} />
              <ScoreBar label="Wage growth" value={m.wage_growth} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <DemandBadge score={m.demand_score} />
              {m.funding_eligible && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-[#1B4F8A] border border-blue-200">
                  ✓ LMDA/WDA eligible
                </span>
              )}
            </div>

            {m.transferable_skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Skills you already have
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {m.transferable_skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#EDF4FF] text-[#1B4F8A] border border-[#C7DEFF] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {m.training_programs.length > 0 && (
              <p className="text-xs text-gray-500 mb-1.5">
                Training: {m.training_programs.slice(0, 2).join(" · ")}
              </p>
            )}
            {m.ai_tools.length > 0 && (
              <p className="text-xs text-gray-400 mb-4">
                AI tools: {m.ai_tools.slice(0, 3).join(", ")}
              </p>
            )}

            <button
              onClick={() => onSelect(m)}
              className="w-full bg-[#1B4F8A] hover:bg-[#163E6E] text-white text-sm py-2.5 rounded-xl font-semibold transition-colors"
            >
              Select this program →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

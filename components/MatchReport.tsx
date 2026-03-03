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

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-gray-300";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
    </div>
  );
}

function DemandBadge({ score }: { score: number }) {
  const label = score >= 0.70 ? "High demand" : score >= 0.50 ? "Moderate demand" : "Lower demand";
  const color = score >= 0.70 ? "bg-green-100 text-green-800" : score >= 0.50 ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
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
      <button onClick={onBack} className="text-sm text-blue-600 mb-6">← Back</button>

      <h1 className="text-2xl font-bold mb-1">Trade Pathways</h1>
      <p className="text-gray-500 text-sm mb-6">
        {sourceTitle} (NOC {sourceNoc}) · {form.province} · {form.yearsExperience}yr experience
      </p>

      <div className="space-y-4">
        {matches.map((m, i) => (
          <div key={m.noc_code} className="border rounded-lg p-5 hover:shadow-sm transition">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="text-xs text-gray-400 mr-2">#{i + 1}</span>
                <span className="font-semibold">{m.title}</span>
                <span className="ml-2 text-xs text-gray-400">NOC {m.noc_code} · TEER {m.teer}</span>
                <p className="text-xs text-gray-400">{TEER_LABEL[m.teer] ?? "Trade"} training</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(m.composite_score * 100)}
                </div>
                <div className="text-xs text-gray-400">match score</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
              <div>
                <div className="text-gray-400 mb-1">Skill transfer</div>
                <ScoreBar value={m.skill_similarity} />
              </div>
              <div>
                <div className="text-gray-400 mb-1">Market demand</div>
                <ScoreBar value={m.demand_score} />
              </div>
              <div>
                <div className="text-gray-400 mb-1">Wage growth</div>
                <ScoreBar value={m.wage_growth} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <DemandBadge score={m.demand_score} />
              {m.funding_eligible && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                  ✓ LMDA/WDA eligible
                </span>
              )}
            </div>

            {m.training_programs.length > 0 && (
              <p className="text-xs text-gray-500 mb-2">
                Training: {m.training_programs.slice(0, 2).join(" · ")}
              </p>
            )}
            {m.ai_tools.length > 0 && (
              <p className="text-xs text-gray-400 mb-3">
                AI tools: {m.ai_tools.slice(0, 3).join(", ")}
              </p>
            )}

            <button
              onClick={() => onSelect(m)}
              className="w-full mt-1 border border-blue-600 text-blue-600 text-sm py-1.5 rounded hover:bg-blue-50 transition"
            >
              Select this program →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

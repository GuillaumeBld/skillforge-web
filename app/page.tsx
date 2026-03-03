// app/page.tsx
"use client";
import { useState } from "react";
import { IntakeForm } from "@/components/IntakeForm";
import { matchOccupations } from "@/lib/engine";
import type { IntakeFormData, MatchResponse, MatchResultItem } from "@/types/skillforge";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ form: IntakeFormData; match: MatchResponse } | null>(null);
  const [selected, setSelected] = useState<MatchResultItem | null>(null);

  const handleSubmit = async (data: IntakeFormData) => {
    if (!data.noc) {
      setError("Job title not recognized. Enter a NOC code manually or try a different title.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const match = await matchOccupations({
        current_noc: data.noc,
        current_title: data.jobTitle,
        years_experience: data.yearsExperience,
        province: data.province,
        is_youth: data.isYouth,
        is_newcomer: data.isNewcomer,
        is_indigenous: data.isIndigenous,
        is_visible_minority: data.isVisibleMinority,
        is_person_with_disability: data.isDisability,
        top_k: 5,
      });
      setResult({ form: data, match });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      if (msg.includes("fetch")) {
        setError("SkillForge engine is not running. Start it with `make run` in the skillforge/ directory.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (result && selected) {
    // Screen 3 placeholder — built in Task 7
    return <div>Referral package for {selected.title} (Task 7)</div>;
  }

  if (result && !selected) {
    // Screen 2 placeholder — built in Task 6
    return (
      <div>
        <p>Results for {result.form.jobTitle}: {result.match.matches.length} matches. (Task 6)</p>
        <button onClick={() => setResult(null)}>Back</button>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      {error && (
        <div className="max-w-lg mx-auto mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
          {error}
        </div>
      )}
      <IntakeForm onSubmit={handleSubmit} loading={loading} />
    </main>
  );
}

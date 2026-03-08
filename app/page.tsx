// app/page.tsx
"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { IntakeForm } from "@/components/IntakeForm";
import { MatchReport } from "@/components/MatchReport";
import { ReferralPackage } from "@/components/ReferralPackage";
import { matchOccupations, saveIntakeRecord } from "@/lib/engine";
import type { IntakeFormData, MatchResponse, MatchResultItem } from "@/types/skillforge";

export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ form: IntakeFormData; match: MatchResponse } | null>(null);
  const [selected, setSelected] = useState<MatchResultItem | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleSelect = async (match: MatchResultItem) => {
    setSelected(match);
    if (session?.user?.id) {
      saveIntakeRecord({
        school_id: session.user.id,
        worker_title: result?.form?.jobTitle ?? "",
        source_noc: result?.match?.source_noc ?? "",
        matched_noc: match.noc_code,
        matched_title: match.title,
        composite_score: match.composite_score,
        funding_eligible: match.funding_eligible,
        province: result?.form?.province ?? "ON",
      });
    }
    if (!result) return;
    setPdfLoading(true);
    setPdfBlob(null);
    setPdfError(null);
    try {
      const res = await fetch("/api/referral-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, form: result.form }),
      });
      if (res.ok) setPdfBlob(await res.blob());
      else setPdfError("Could not generate PDF. Please try again.");
    } catch {
      setPdfError("Could not generate PDF. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

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
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <ReferralPackage
          match={selected}
          form={result.form}
          pdfBlob={pdfBlob}
          pdfLoading={pdfLoading}
          pdfError={pdfError}
          onBack={() => { setSelected(null); setPdfBlob(null); setPdfError(null); }}
        />
      </main>
    );
  }

  if (result && !selected) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <MatchReport
          sourceTitle={result.match.source_title}
          sourceNoc={result.match.source_noc}
          matches={result.match.matches}
          form={result.form}
          onSelect={handleSelect}
          onBack={() => setResult(null)}
        />
      </main>
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

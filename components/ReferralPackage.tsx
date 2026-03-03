// components/ReferralPackage.tsx
"use client";
import { useState } from "react";
import type { MatchResultItem, IntakeFormData } from "@/types/skillforge";

const FUNDING_BY_PROVINCE: Record<string, { lmda: string; wda: string }> = {
  ON: { lmda: "up to $28,000", wda: "Canada Job Grant + WDA" },
  BC: { lmda: "up to $20,000 (StrongerBC)", wda: "Canada Job Grant" },
  AB: { lmda: "up to $15,000", wda: "Canada Job Grant" },
  QC: { lmda: "up to $20,000 (Emploi-Québec)", wda: "PAMT" },
  default: { lmda: "up to $15,000", wda: "Canada Job Grant" },
};

interface Props {
  match: MatchResultItem;
  form: IntakeFormData;
  onBack: () => void;
}

export function ReferralPackage({ match, form, onBack }: Props) {
  const [downloading, setDownloading] = useState(false);
  const funding = FUNDING_BY_PROVINCE[form.province] ?? FUNDING_BY_PROVINCE["default"];
  const isRedSeal = match.teer <= 2 && match.noc_code[0] === "7";

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/referral-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ match, form }),
      });
      if (!res.ok) throw new Error(`PDF generation failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skillforge-referral-${match.noc_code}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const checklistItems = [
    "Proof of identity (SIN + government photo ID)",
    "Record of Employment (ROE) from last employer",
    "EI application / EI statement (if EI-eligible)",
    "Educational credentials (if applicable)",
    `Proof of residence in ${form.province}`,
    form.isYouth ? "Proof of age (youth 15-29 priority)" : null,
    form.isNewcomer ? "Permanent Resident card / proof of landing date" : null,
    form.isIndigenous ? "Indigenous status documentation (self-identification accepted)" : null,
  ].filter((item): item is string => item !== null);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button onClick={onBack} className="text-sm text-blue-600 mb-6">← Back to matches</button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h1 className="text-xl font-bold mb-1">Referral Package</h1>
        <p className="text-gray-600 text-sm">
          {form.jobTitle} → {match.title} (NOC {match.noc_code})
        </p>
      </div>

      <section className="mb-6">
        <h2 className="font-semibold mb-3">Funding Eligibility</h2>
        <div className="space-y-2 text-sm">
          {form.isEiEligible !== false && (
            <div className="flex items-start gap-2">
              <span className="text-green-600 flex-shrink-0">✓</span>
              <div>
                <strong>LMDA (EI-funded)</strong> — {funding.lmda} for approved training
              </div>
            </div>
          )}
          <div className="flex items-start gap-2">
            <span className="text-green-600 flex-shrink-0">✓</span>
            <div>
              <strong>WDA</strong> — {funding.wda} (all displaced workers)
            </div>
          </div>
          {isRedSeal && (
            <>
              <div className="flex items-start gap-2">
                <span className="text-green-600 flex-shrink-0">✓</span>
                <div><strong>Apprenticeship Incentive Grant</strong> — $1,000/year during apprenticeship</div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 flex-shrink-0">✓</span>
                <div><strong>Apprenticeship Completion Bonus</strong> — $2,000 at Red Seal</div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold mb-3">LMDA Referral Checklist</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          {checklistItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-0.5 w-4 h-4 border border-gray-400 rounded-sm flex-shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="font-semibold mb-3">Training Program</h2>
        <div className="text-sm text-gray-700 space-y-1">
          <p>Program: {match.training_programs[0] ?? "Trade school / apprenticeship"}</p>
          <p>NOC: {match.noc_code} — {match.title}</p>
          <p>TEER level: {match.teer} — {match.teer <= 2 ? "Apprenticeship / Red Seal eligible" : "Certificate / diploma"}</p>
        </div>
      </section>

      <div className="flex gap-3">
        <button
          onClick={download}
          disabled={downloading}
          className="flex-1 bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
        >
          {downloading ? "Generating PDF…" : "Download PDF"}
        </button>
        <button className="flex-1 border border-gray-300 py-2 rounded font-medium text-sm text-gray-700">
          Email to worker
        </button>
      </div>
    </div>
  );
}
